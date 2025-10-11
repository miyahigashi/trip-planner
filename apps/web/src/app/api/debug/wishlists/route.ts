// apps/web/src/app/api/debug/wishlists/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";            // いつも使ってる Drizzle のインスタンス
import { wishlists } from "@/db/schema"; // あなたのテーブル
import { sql } from "drizzle-orm";

export const runtime = "nodejs"; // 念のため Edge ではなく Node で


export async function GET() {
  const { userId } = await auth();  // 本番で正しい userId が取れてるかを確認
  let count = null;
  let tables: string[] = [];
  try {
    const r = await db.select({ c: sql<number>`count(*)`.as("c") }).from(wishlists);
    count = r?.[0]?.c ?? 0;

    // スキーマが想定通りかも軽く確認
    const tt = await db.execute(sql`select table_name from information_schema.tables where table_schema='public' order by 1 limit 10`);
    tables = (tt.rows as any[]).map((x) => x.table_name);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e), userId }, { status: 500 });
  }

  const maskedDb = process.env.DATABASE_URL?.replace(/:.+@/, ":****@"); // DSN を一部マスク
  return NextResponse.json({ ok: true, userId, wishlistsCount: count, tables, db: maskedDb });
}
