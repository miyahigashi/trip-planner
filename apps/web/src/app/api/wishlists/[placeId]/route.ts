// apps/web/src/app/wishlists/[placeId]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { wishlists } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ensureDbUser } from "@/lib/user";

type Ctx = { params: { placeId: string } };

// CORS / preflight 用（params は受け取らない！）
export function OPTIONS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      // ここは必要に応じて調整
      "Allow": "PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// メモ更新
export async function PATCH(req: Request, { params }: Ctx) {
  const user = await ensureDbUser();
  const { note } = await req.json().catch(() => ({ note: null as string | null }));
  const normalized = note && note.trim() ? note : null;

  await db
    .update(wishlists)
    .set({ note: normalized })
    .where(and(eq(wishlists.userId, user.id), eq(wishlists.placeId, params.placeId)));

  return NextResponse.json({ ok: true });
}

// 削除
export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await ensureDbUser();

  const hit = await db
    .select({ placeId: wishlists.placeId })
    .from(wishlists)
    .where(and(eq(wishlists.userId, user.id), eq(wishlists.placeId, params.placeId)))
    .limit(1);

  if (hit.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .delete(wishlists)
    .where(and(eq(wishlists.userId, user.id), eq(wishlists.placeId, params.placeId)));

  return new Response(null, { status: 204 });
}
