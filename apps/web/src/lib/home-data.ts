// apps/web/src/lib/home-data.ts
import { db } from "../db/client";
import { trips, wishlists, places, users } from "../db/schema"; // ★ users(=profiles等)を追加
import { desc, eq, sql } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";

export async function fetchHomeData(clerkUserId: string | null) {
  noStore();
  if (!clerkUserId) return { trips: [], wishes: [], topTags: [] as string[] };

  // 1) Clerk ID -> 内部UUID
  const u = await db
    .select({ id: users.id })                 // users.id は UUID
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))// users.clerkUserId は "user_..." 文字列
    .limit(1);

  const internalUserId = u[0]?.id;
  if (!internalUserId) {
    console.warn("[home-data] no internal user for", clerkUserId);
    return { trips: [], wishes: [], topTags: [] as string[] };
  }

  // 2) UUIDで絞る
  const [t, w, tagsRes] = await Promise.all([
    db
      .select()
      .from(trips)
      .where(eq(trips.ownerId, internalUserId))
      .orderBy(desc(trips.updatedAt))
      .limit(4),

    db
      .select({
        id: wishlists.id,
        createdAt: wishlists.createdAt,
        name: places.name,
        imageUrl: places.imageUrl, // 例: "images/.../w800.webp" （GCSのオブジェクトキー）
        photoRef: places.photoRef, // 例: Google Places の photo_reference
      })
      .from(wishlists)
      .leftJoin(places, eq(wishlists.placeId, places.placeId))
      .where(eq(wishlists.userId, internalUserId)) // ★ UUID同士で比較
      .orderBy(desc(wishlists.createdAt))
      .limit(6),

    db.execute(sql`
      with ut as (
        select unnest(coalesce(${trips.tags}, '{}')) as tag
        from ${trips}
        where ${trips.ownerId} = ${internalUserId}
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
  ]);

  const topTags = (tagsRes.rows?.[0]?.tags ?? []) as string[];
  return { trips: t, wishes: w, topTags };
}
