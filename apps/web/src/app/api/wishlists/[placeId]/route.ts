// apps/web/src/app/api/wishlists/[placeId]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { wishlists } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ensureDbUser } from "@/lib/user";

/** URL から placeId を安全に取り出す */
function getPlaceIdFromUrl(urlStr: string) {
  const url = new URL(urlStr);
  const segs = url.pathname.split("/");
  const idx = segs.lastIndexOf("wishlists");
  return segs[idx + 1] || "";
}

/* ---------------- DELETE（既存） ---------------- */
export async function DELETE(req: Request) {
  const placeId = getPlaceIdFromUrl(req.url);
  if (!placeId) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const user = await ensureDbUser();

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

/* ---------------- PATCH（★新規追加） ---------------- */
export async function PATCH(req: Request) {
  const placeId = getPlaceIdFromUrl(req.url);
  if (!placeId) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const user = await ensureDbUser();

  // ボディ取得（空でも動くように try/catch）
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  // 空文字・空白のみは NULL として保存
  const rawNote = typeof body.note === "string" ? body.note : "";
  const note = rawNote.trim() ? rawNote.trim() : null;

  // 対象レコードがあるか（なければ 404）
  const hit = await db
    .select({ placeId: wishlists.placeId })
    .from(wishlists)
    .where(and(eq(wishlists.userId, user.id), eq(wishlists.placeId, placeId)))
    .limit(1);

  if (hit.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 更新
  const updated = await db
    .update(wishlists)
    .set({ note })
    .where(and(eq(wishlists.userId, user.id), eq(wishlists.placeId, placeId)))
    .returning({ placeId: wishlists.placeId, note: wishlists.note });

  return NextResponse.json({ item: updated[0] }, { status: 200 });
}
