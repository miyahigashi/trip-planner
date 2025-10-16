// apps/web/src/lib/project-data.ts
import "server-only";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
  wishlists,
  places,
  projectMembers,
  projectPrefectures,
  projectCandidates,
  projectSelections,
  users,
} from "@/db/schema";

/* 既存：候補+確定フラグを両方含む“プール” */
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

  const rows = await db
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
      isSelected:  sql<boolean>`(${projectSelections.placeId} is not null)`,
    })
    .from(wishlists)
    .innerJoin(places, eq(wishlists.placeId, places.placeId))
    .leftJoin(
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
    .where(
      and(
        inArray(wishlists.userId, userIds),
        inArray(places.prefecture, prefList),
      )
    )
    .orderBy(desc(wishlists.createdAt))
    .limit(100);

  return rows;
}

/* ★追加：候補だけ */
export async function fetchProjectCandidates(projectId: string) {
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
      // 確実に候補のみ
      isCandidate: sql<boolean>`true`,
      isSelected:  sql<boolean>`(${projectSelections.placeId} is not null)`,
    })
    .from(wishlists)
    .innerJoin(places, eq(wishlists.placeId, places.placeId))
    .innerJoin( // ← 候補に必須
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
    .where(
      and(
        inArray(wishlists.userId, userIds),
        inArray(places.prefecture, prefList),
      )
    )
    .orderBy(desc(wishlists.createdAt))
    .limit(100);
}

/* ★追加：確定だけ */
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
      // 確定のみ
      isSelected:  sql<boolean>`true`,
      dayIndex: projectSelections.dayIndex,
      orderInDay: projectSelections.orderInDay,
    })
    .from(wishlists)
    .innerJoin(places, eq(wishlists.placeId, places.placeId))
    .innerJoin( // ← 確定に必須
      projectSelections,
      and(
        eq(projectSelections.projectId, sql`${projectId}::uuid`),
        eq(projectSelections.placeId, places.placeId)
      )
    )
    .leftJoin(
      projectCandidates,
      and(
        eq(projectCandidates.projectId, sql`${projectId}::uuid`),
        eq(projectCandidates.placeId, places.placeId)
      )
    )
    .where(
      and(
        inArray(wishlists.userId, userIds),
        inArray(places.prefecture, prefList),
      )
    )
    .orderBy(
      asc(projectSelections.dayIndex),
      asc(projectSelections.orderInDay),
      desc(wishlists.createdAt)
    )
    .limit(100);
}

/* 既存 */
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

function toYmd(v: unknown): string | "" {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return "";
}

export async function fetchProjectMeta(projectId: string) {
  const [row] = await db
    .select({ startDate: projects.startDate, endDate: projects.endDate, title: projects.title, description: projects.description })
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
async function byClerkId(clerkUserId: string) {
  const r = await db.select({ id: users.id }).from(users)
    .where(eq(users.clerkUserId, clerkUserId)).limit(1);
  return r[0]?.id ?? null;
}

/** 自分のウィッシュ（プロジェクトの対象都道府県で絞り、候補/確定フラグも付与） */
export async function fetchMyWishesForProject(projectId: string, clerkUserId: string) {
  const me = await byClerkId(clerkUserId);
  if (!me) return [];

  const prefs = await db
    .select({ prefecture: projectPrefectures.prefecture })
    .from(projectPrefectures)
    .where(eq(projectPrefectures.projectId, sql`${projectId}::uuid`));

  const prefList = prefs.map(p => p.prefecture);
  if (prefList.length === 0) return [];

  const rows = await db
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
      isSelected:  sql<boolean>`(${projectSelections.placeId} is not null)`,
    })
    .from(wishlists)
    .innerJoin(places, eq(wishlists.placeId, places.placeId))
    .leftJoin(
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
    .where(
      and(
        eq(wishlists.userId, sql`${me}::uuid`),
        inArray(places.prefecture, prefList),
      )
    )
    .orderBy(desc(wishlists.createdAt))
    .limit(200);

  return rows;
}