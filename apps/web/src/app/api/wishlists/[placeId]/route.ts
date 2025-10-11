// apps/web/src/app/api/wishlists/[placeId]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { wishlists } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ensureDbUser } from "@/lib/user";

export async function DELETE(req: Request) {
  // /api/wishlists/[placeId] から placeId を取得（型トラブル回避のためURL解析で取得）
  const url = new URL(req.url);
  const segs = url.pathname.split("/");
  const idx = segs.lastIndexOf("wishlists");
  const placeId = segs[idx + 1];

  if (!placeId) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const user = await ensureDbUser();

  // 存在チェックは省略してもOKだが、404 を返したいなら以下を使う
  const hit = await db
    .select({ placeId: wishlists.placeId })
    .from(wishlists)
    .where(and(eq(wishlists.userId, user.id), eq(wishlists.placeId, placeId)))
    .limit(1);

  if (hit.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .delete(wishlists)
    .where(and(eq(wishlists.userId, user.id), eq(wishlists.placeId, placeId)));

  return new Response(null, { status: 204 });
}
