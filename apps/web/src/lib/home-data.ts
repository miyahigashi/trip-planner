// apps/web/src/lib/home-data.ts
import { db } from "../db/client"; // 相対パスにするなら: "../db/client"
import { trips, wishlists, places } from "../db/schema";
import { desc, eq, sql } from "drizzle-orm";

/**
 * トップ画面用データ取得
 * - 最近更新の旅 4件
 * - 最近保存したスポット 6件（wishlists → places join）
 * - あなたへのおすすめ（trips.tags 上位3つ）
 */
export async function fetchHomeData(userId: string | null) {
  if (!userId) {
    return { trips: [] as typeof trips.$inferSelect[], wishes: [] as any[], topTags: [] as string[] };
  }

  const [t, w, tagsRes] = await Promise.all([
    db
      .select()
      .from(trips)
      .where(eq(trips.ownerId, userId))
      .orderBy(desc(trips.updatedAt))
      .limit(4),

    db
      .select({
        id: wishlists.id,
        createdAt: wishlists.createdAt,
        name: places.name,
        imageUrl: places.imageUrl,
      })
      .from(wishlists)
      .leftJoin(places, eq(wishlists.placeId, places.placeId))
      // wishlists.userId が uuid のため text にキャストして比較
      .where(sql`${wishlists.userId}::text = ${userId}`)
      .orderBy(desc(wishlists.createdAt))
      .limit(6),

    db.execute(sql`
      with ut as (
        select unnest(coalesce(${trips.tags}, '{}')) as tag
        from ${trips}
        where ${trips.ownerId} = ${userId}
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
