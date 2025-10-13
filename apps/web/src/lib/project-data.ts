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
  projectSelections, // ← ここでまとめてimport
} from "@/db/schema";

export async function fetchProjectCandidatesPool(projectId: string) {
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
    .leftJoin( // ★ 追加
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
    .where(eq(projectSelections.projectId, sql`${projectId}::uuid`)) // ★ uuidキャスト
    .orderBy(asc(projectSelections.dayIndex), asc(projectSelections.orderInDay));
}

function toYmd(v: unknown): string | "" {
  if (!v) return "";
  // Drizzleのdate型は DB設定により string or Date のどちらか
  if (typeof v === "string") return v;                 // 例: "2026-04-09"
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