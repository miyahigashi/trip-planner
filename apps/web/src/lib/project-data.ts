// apps/web/src/lib/project-data.ts
import "server-only";
import { db } from "@/db/client";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
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
} from "@/db/schema";
import { auth } from "@clerk/nextjs/server";

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
export async function fetchProjectCandidates(projectId: string, clerkUserId?: string) {
  // メンバーと対象都道府県の絞り込み（既存ロジック）
  const members = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, sql`${projectId}::uuid`));

  const prefs = await db
    .select({ prefecture: projectPrefectures.prefecture })
    .from(projectPrefectures)
    .where(eq(projectPrefectures.projectId, sql`${projectId}::uuid`));

  const userIds = members.map(m => m.userId).filter(Boolean) as string[];
  const prefList = prefs.map(p => p.prefecture);
  if (userIds.length === 0 || prefList.length === 0) return [];

  // 自分の users.id（votedByMe 判定用）
  let me: string | null = null;
  if (clerkUserId) {
    const r = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    me = r[0]?.id ?? null;
  }

  const pcv = projectCandidateVotes;

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

      // 状態フラグ
      isCandidate: sql<boolean>`true`,
      isSelected:  sql<boolean>`(${projectSelections.placeId} is not null)`,

      // ★ 集計列（重要）
      votes: sql<number>`COALESCE(COUNT(DISTINCT ${pcv.userId}), 0)`,
      votedByMe: me
        ? sql<boolean>`
            SUM(CASE WHEN ${pcv.userId} = ${sql`${me}::uuid`} THEN 1 ELSE 0 END) > 0
          `
        : sql<boolean>`false`,
    })
    .from(wishlists)
    .innerJoin(places, eq(wishlists.placeId, places.placeId))
    .innerJoin(
      projectCandidates,
      and(
        eq(projectCandidates.projectId, sql`${projectId}::uuid`),
        eq(projectCandidates.placeId, places.placeId)
      )
    )
    .leftJoin(
      projectSelections,
      and(
        eq(projectSelections.projectId, sql`${projectId}::uuid`),
        eq(projectSelections.placeId, places.placeId)
      )
    )
    .leftJoin(
      pcv,
      and(
        eq(pcv.projectId, sql`${projectId}::uuid`),
        eq(pcv.placeId, places.placeId)
      )
    )
    .where(and(
      inArray(wishlists.userId, userIds),
      inArray(places.prefecture, prefList),
    ))
    // 集計を使うので groupBy が必要
    .groupBy(
      wishlists.id, places.placeId, places.name, places.prefecture,
      places.imageUrl, places.photoRef, places.rating,
      places.userRatingsTotal, wishlists.createdAt, projectSelections.placeId
    )
    .orderBy(desc(wishlists.createdAt))
    .limit(100);
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
  const [row] = await db
    .select({
      startDate: projects.startDate,
      endDate: projects.endDate,
      title: projects.title,
      description: projects.description,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!row) return null;
  return {
    startDate: toYmd(row.startDate),
    endDate: toYmd(row.endDate),
    title: row.title,
    description: row.description,
  };
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
export async function fetchMyWishesForProject(projectId: string, clerkUserId: string) {
  const me = await byClerkId(clerkUserId);
  if (!me) return [];

  const prefs = await db
    .select({ prefecture: projectPrefectures.prefecture })
    .from(projectPrefectures)
    .where(eq(projectPrefectures.projectId, sql`${projectId}::uuid`));

  const prefList = prefs.map((p) => p.prefecture);
  if (prefList.length === 0) return [];

  // 自分が投票しているか（BOOL_OR）
  const votedByMe = sql<boolean>`
    COALESCE(BOOL_OR(${projectCandidateVotes.userId} = ${sql`${me}::uuid`}), false)
  `;

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
      isCandidate: sql<boolean>`(${projectCandidates.id} is not null)`,
      isSelected: sql<boolean>`(${projectSelections.placeId} is not null)`,
      votes: votesCount,
      voters,
      votedByMe,
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
    .leftJoin(
      projectCandidateVotes,
      and(
        eq(projectCandidateVotes.projectId, sql`${projectId}::uuid`),
        eq(projectCandidateVotes.placeId, places.placeId),
      ),
    )
    .leftJoin(users, eq(users.id, projectCandidateVotes.userId))
    .where(and(eq(wishlists.userId, sql`${me}::uuid`), inArray(places.prefecture, prefList)))
    .groupBy(
      wishlists.id,
      places.placeId,
      places.name,
      places.prefecture,
      places.imageUrl,
      places.photoRef,
      places.rating,
      places.userRatingsTotal,
      projectCandidates.id,
      projectSelections.placeId,
    )
    .orderBy(desc(wishlists.createdAt))
    .limit(200);
}
