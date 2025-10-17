// apps/web/src/lib/project-data.ts
import "server-only";
import { db } from "@/db/client";
import { and, asc, desc, eq, inArray, sql,countDistinct } from "drizzle-orm";
import {
  projects,
  users,
  places,
  wishlists,
  projectMembers,
  projectPrefectures,
  projectCandidates,
  projectSelections,
  projectCandidateVotes,
  userProfiles,
} from "@/db/schema";
export type Member = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};
/* ------------------------------ 共通SQL片 ------------------------------ */

// 票数（0票でも 0 に）
const votesCount = sql<number>`COALESCE(COUNT(${projectCandidateVotes.userId}), 0)`;

// 投票者表示名（handle なければ email、重複は除外、最大5件）
const voters = sql<string[]>`
  COALESCE(
    (
      ARRAY_AGG(
        DISTINCT COALESCE(${users.handle}, ${users.email})
      ) FILTER (WHERE ${users.id} IS NOT NULL)
    )[1:5],
    ARRAY[]::text[]
  )
`;

/* ------------------------------ 取得系 ------------------------------ */

/** 候補 + 確定フラグを併記した“プール”（= 自分たちメンバーの wishlists の中から、対象都道府県だけを抽出） */
export async function fetchProjectCandidatesPool(projectId: string) {
  const members = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, sql`${projectId}::uuid`));

  const prefs = await db
    .select({ prefecture: projectPrefectures.prefecture })
    .from(projectPrefectures)
    .where(eq(projectPrefectures.projectId, sql`${projectId}::uuid`));

  const userIds = members.map((m) => m.userId).filter(Boolean) as string[];
  const prefList = prefs.map((p) => p.prefecture);
  if (userIds.length === 0 || prefList.length === 0) return [];

  return db
    .select({
      id: wishlists.id,
      placeId: places.placeId,
      name: places.name,
      prefecture: places.prefecture,
      imageUrl: places.imageUrl,
      photoRef: places.photoRef,
      rating: places.rating,
      userRatingsTotal: places.userRatingsTotal,
      createdAt: wishlists.createdAt,
      isCandidate: sql<boolean>`(${projectCandidates.id} is not null)`,
      isSelected: sql<boolean>`(${projectSelections.placeId} is not null)`,
      votes: votesCount,
      voters,
    })
    .from(wishlists)
    .innerJoin(places, eq(wishlists.placeId, places.placeId))
    .leftJoin(
      projectCandidates,
      and(
        eq(projectCandidates.projectId, sql`${projectId}::uuid`),
        eq(projectCandidates.placeId, places.placeId),
      ),
    )
    .leftJoin(
      projectSelections,
      and(
        eq(projectSelections.projectId, sql`${projectId}::uuid`),
        eq(projectSelections.placeId, places.placeId),
      ),
    )
    // ★ 票は LEFT JOIN（0票でも候補が表示される）
    .leftJoin(
      projectCandidateVotes,
      and(
        eq(projectCandidateVotes.projectId, sql`${projectId}::uuid`),
        eq(projectCandidateVotes.placeId, places.placeId),
      ),
    )
    .leftJoin(users, eq(users.id, projectCandidateVotes.userId))
    .where(and(inArray(wishlists.userId, userIds), inArray(places.prefecture, prefList)))
    .groupBy(
      wishlists.id,
      places.placeId,
      places.name,
      places.prefecture,
      places.imageUrl,
      places.photoRef,
      places.rating,
      places.userRatingsTotal,
      wishlists.createdAt,
      projectCandidates.id,
      projectSelections.placeId,
    )
    .orderBy(desc(wishlists.createdAt))
    .limit(100);
}

/** 候補だけ（共有候補タブ） */
export async function fetchProjectCandidates(projectId: string, appUserId?: string) {
  // appUserId 未ログイン時は false を返すSQL
  const votedExpr = appUserId
    ? sql<boolean>`exists(
        select 1 from ${projectCandidateVotes} v
        where v.project_id = ${projectId}
          and v.place_id   = ${places.placeId}
          and v.user_id    = ${appUserId}
      )`
    : sql<boolean>`false`;

  const rows = await db
    .select({
      id: projectCandidates.id,
      placeId: places.placeId,
      name: places.name,
      prefecture: places.prefecture,
      imageUrl: places.imageUrl,
      photoRef: places.photoRef,

      // 票数
      votes: sql<number>`coalesce(count(distinct ${projectCandidateVotes.userId}), 0)`,

      // 自分が投票済みか
      votedByMe: votedExpr,

      // 既存の選択状態など
      isSelected: sql<boolean>`(${projectSelections.placeId} is not null)`,
    })
    .from(projectCandidates)
    .innerJoin(places, eq(projectCandidates.placeId, places.placeId))
    .leftJoin(
      projectSelections,
      and(
        eq(projectSelections.projectId, projectId),
        eq(projectSelections.placeId, places.placeId),
      )
    )
    .leftJoin(
      projectCandidateVotes,
      and(
        eq(projectCandidateVotes.projectId, projectId),
        eq(projectCandidateVotes.placeId, places.placeId),
      )
    )
    .where(eq(projectCandidates.projectId, projectId))
    .groupBy(
      projectCandidates.id,
      places.placeId,
      places.name,
      places.prefecture,
      places.imageUrl,
      places.photoRef,
      projectSelections.placeId
    );

  return rows;
}

/** 確定だけ（確定タブ） */
export async function fetchProjectSelected(projectId: string) {
  const members = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, sql`${projectId}::uuid`));

  const prefs = await db
    .select({ prefecture: projectPrefectures.prefecture })
    .from(projectPrefectures)
    .where(eq(projectPrefectures.projectId, sql`${projectId}::uuid`));

  const userIds = members.map((m) => m.userId).filter(Boolean) as string[];
  const prefList = prefs.map((p) => p.prefecture);
  if (userIds.length === 0 || prefList.length === 0) return [];

  return db
    .select({
      id: wishlists.id,
      placeId: places.placeId,
      name: places.name,
      prefecture: places.prefecture,
      imageUrl: places.imageUrl,
      photoRef: places.photoRef,
      rating: places.rating,
      userRatingsTotal: places.userRatingsTotal,
      createdAt: wishlists.createdAt,
      isCandidate: sql<boolean>`(${projectCandidates.id} is not null)`,
      isSelected: sql<boolean>`true`,
      dayIndex: projectSelections.dayIndex,
      orderInDay: projectSelections.orderInDay,
      votes: votesCount,
      voters,
    })
    .from(wishlists)
    .innerJoin(places, eq(wishlists.placeId, places.placeId))
    .innerJoin(
      projectSelections,
      and(
        eq(projectSelections.projectId, sql`${projectId}::uuid`),
        eq(projectSelections.placeId, places.placeId),
      ),
    )
    .leftJoin(
      projectCandidates,
      and(
        eq(projectCandidates.projectId, sql`${projectId}::uuid`),
        eq(projectCandidates.placeId, places.placeId),
      ),
    )
    .leftJoin(
      projectCandidateVotes,
      and(
        eq(projectCandidateVotes.projectId, sql`${projectId}::uuid`),
        eq(projectCandidateVotes.placeId, places.placeId),
      ),
    )
    .leftJoin(users, eq(users.id, projectCandidateVotes.userId))
    .where(and(inArray(wishlists.userId, userIds), inArray(places.prefecture, prefList)))
    .groupBy(
      wishlists.id,
      places.placeId,
      places.name,
      places.prefecture,
      places.imageUrl,
      places.photoRef,
      places.rating,
      places.userRatingsTotal,
      wishlists.createdAt,
      projectCandidates.id,
      projectSelections.projectId,
      projectSelections.placeId,
      projectSelections.dayIndex,
      projectSelections.orderInDay,
    )
    .orderBy(
      asc(projectSelections.dayIndex),
      asc(projectSelections.orderInDay),
      desc(wishlists.createdAt),
    )
    .limit(100);
}

/** “しおり”用の並び */
export async function fetchSelections(projectId: string) {
  return db
    .select({
      placeId: places.placeId,
      name: places.name,
      imageUrl: places.imageUrl,
      photoRef: places.photoRef,
      prefecture: places.prefecture,
      dayIndex: projectSelections.dayIndex,
      orderInDay: projectSelections.orderInDay,
      note: projectSelections.note,
    })
    .from(projectSelections)
    .innerJoin(places, eq(projectSelections.placeId, places.placeId))
    .where(eq(projectSelections.projectId, sql`${projectId}::uuid`))
    .orderBy(asc(projectSelections.dayIndex), asc(projectSelections.orderInDay));
}

/* util: Date → yyyy-mm-dd 文字列 */
function toYmd(v: unknown): string | "" {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return "";
}

/** プロジェクト基本情報 */
export async function fetchProjectMeta(projectId: string) {
  const [project] = await db
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      startDate: projects.startDate,
      endDate: projects.endDate,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  const members = await db
    .select({
      id: users.id,
      email: users.email,
      name: userProfiles.displayName,
      avatarUrl: userProfiles.avatarKey,
    })
    .from(projectMembers)
    .innerJoin(users, eq(users.id, projectMembers.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(projectMembers.projectId, projectId));

  return project ? { ...project, members } : null;
}

/* Clerk の ID → 内部 users.id */
async function byClerkId(clerkUserId: string) {
  const r = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return r[0]?.id ?? null;
}

/** 自分の wishlists（対象都道府県のみ）。候補/確定フラグ・票情報付き */
export async function fetchMyWishesForProject(projectId: string, userId: string) {
  // プロジェクトに設定された都道府県
  const prefs = await db
    .select({ prefecture: projectPrefectures.prefecture })
    .from(projectPrefectures)
    .where(eq(projectPrefectures.projectId, projectId));

  const selectedPrefs = prefs.map(p => p.prefecture);
  // 都道府県未設定なら全件（where 条件を外す）
  const wherePref = selectedPrefs.length
    ? inArray(places.prefecture, selectedPrefs)
    : undefined;

  const rows = await db
    .select({
      id: wishlists.id,
      placeId: places.placeId,
      name: places.name,
      prefecture: places.prefecture,
      imageUrl: places.imageUrl,
      photoRef: places.photoRef,
      isCandidate: sql<boolean>`${projectCandidates.placeId} is not null`,
      isSelected:  sql<boolean>`${projectSelections.placeId} is not null`,
      votes:       sql<number>`COALESCE(${countDistinct(projectCandidateVotes.userId)}, 0)`,
      createdAt:   wishlists.createdAt,
    })
    .from(wishlists)
    .innerJoin(places, eq(wishlists.placeId, places.placeId))
    // 👇 ここをすべて LEFT JOIN に
    .leftJoin(
      projectCandidates,
      and(
        eq(projectCandidates.projectId, projectId),
        eq(projectCandidates.placeId, places.placeId)
      )
    )
    .leftJoin(
      projectSelections,
      and(
        eq(projectSelections.projectId, projectId),
        eq(projectSelections.placeId, places.placeId)
      )
    )
    .leftJoin(
      projectCandidateVotes,
      and(
        eq(projectCandidateVotes.projectId, projectId),
        eq(projectCandidateVotes.placeId, places.placeId)
      )
    )
    .where(
      and(
        eq(wishlists.userId, userId),
        wherePref ?? sql`true`
      )
    )
    .groupBy(
      wishlists.id,
      places.placeId,
      places.name,
      places.prefecture,
      places.imageUrl,
      places.photoRef,
      projectCandidates.placeId,
      projectSelections.placeId,
      wishlists.createdAt
    )
    .orderBy(desc(wishlists.createdAt));

  return rows;
}

export async function fetchProjectPrefectures(projectId: string) {
  const rows = await db
    .select({ prefecture: projectPrefectures.prefecture })
    .from(projectPrefectures)
    .where(eq(projectPrefectures.projectId, projectId));
  return rows.map(r => r.prefecture);
}

export async function fetchProjectMembers(projectId: string): Promise<Member[]> {
  const rows = await db
    .select({
      id: users.id,
      name: userProfiles.displayName,
      email: users.email,
      avatarUrl: userProfiles.avatarKey,
    })
    .from(projectMembers)                               // ★ ここを起点にする
    .innerJoin(users, eq(users.id, projectMembers.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(projectMembers.projectId, projectId));    // ★ 参照 OK

  return rows.map(r => ({
    id: r.id,
    name: r.name ?? null,
    email: r.email ?? null,
    avatarUrl: r.avatarUrl ?? null,
  }));
}