// apps/web/src/lib/home-data.ts
import "server-only";
import { db } from "../db/client";
import {
  trips,
  wishlists,
  places,
  users,
  projects,
  projectMembers,
} from "../db/schema";
import { desc, eq, sql, asc } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";

type UpcomingProject = {
  id: string;
  title: string;
  description: string | null;
  startDate: string | null; // DB型に合わせて必要なら Date に変える
  endDate: string | null;
  updatedAt: string | null;
};

export async function fetchHomeData(clerkUserId: string | null) {
  noStore();

  // 未ログイン時
  if (!clerkUserId) {
    return {
      trips: [] as typeof trips.$inferSelect[],
      wishes: [] as any[],
      topTags: [] as string[],
      upcomingProjects: [] as UpcomingProject[],
    };
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Clerk userId -> 内部 users.id(UUID)
  const u = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  const internalUserId = u[0]?.id;
  if (!internalUserId) {
    console.warn("[home-data] no internal user for", clerkUserId);
    return {
      trips: [] as typeof trips.$inferSelect[],
      wishes: [] as any[],
      topTags: [] as string[],
      upcomingProjects: [] as UpcomingProject[],
    };
  }

  const [t, w, tagsRes, upcoming] = await Promise.all([
    // ✅ 元の仕様を維持：trips は ownerId=Clerk の userId(文字列)
    db
      .select()
      .from(trips)
      .where(eq(trips.ownerId, clerkUserId))
      .orderBy(desc(trips.updatedAt))
      .limit(4),

    // ✅ wishlists は内部 UUID で紐付け
    db
      .select({
        id: wishlists.id,
        createdAt: wishlists.createdAt,
        name: places.name,
        imageUrl: places.imageUrl, // 例: "images/.../w800.webp"（GCSオブジェクトキー）
        photoRef: places.photoRef, // Google Places の photo_reference
      })
      .from(wishlists)
      .leftJoin(places, eq(wishlists.placeId, places.placeId))
      .where(eq(wishlists.userId, internalUserId))
      .orderBy(desc(wishlists.createdAt))
      .limit(6),

    // ✅ トップタグ（trips.tags から抽出）※ trips は Clerk で絞る
    db.execute(sql`
      with ut as (
        select unnest(coalesce(${trips.tags}, '{}')) as tag
        from ${trips}
        where ${trips.ownerId} = ${clerkUserId}
      )
      select array(
        select tag from (
          select tag, count(*) c
          from ut
          group by 1
          order by c desc, tag asc
          limit 3
        ) s
      ) as tags;
    `),

    // ✅ これからのプロジェクト：自分(内部UUID)がメンバー & 終了日が未設定 or 今日以降
    db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        startDate: projects.startDate as any,
        endDate: projects.endDate as any,
        updatedAt: projects.updatedAt as any,
      })
      .from(projectMembers)
      .innerJoin(projects, eq(projectMembers.projectId, projects.id))
      .where(
        sql`
          ${projectMembers.userId} = ${internalUserId}
          AND ( ${projects.endDate} IS NULL OR ${projects.endDate} >= ${today} )
        `
      )
      // 近い開始日優先 → 同じなら更新新しい順
      .orderBy(asc(projects.startDate), desc(projects.updatedAt))
      .limit(6),
  ]);

  const topTags = (tagsRes.rows?.[0]?.tags ?? []) as string[];
  return {
    trips: t,
    wishes: w,
    topTags,
    upcomingProjects: upcoming as UpcomingProject[],
  };
}
