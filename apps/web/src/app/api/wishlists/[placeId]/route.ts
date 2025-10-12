// apps/web/src/app/api/wishlists/[placeId]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { wishlists } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ensureDbUser } from "@/lib/user";

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function PATCH(req: Request, ctx: any) {
  const placeId = ctx?.params?.placeId as string;

  const user = await ensureDbUser();
  const body = await req.json().catch(() => ({} as any));
  const raw: string | null | undefined = (body as any)?.note;
  const note = raw && raw.trim() ? raw : null;

  await db
    .update(wishlists)
    .set({ note })
    .where(and(eq(wishlists.userId, user.id), eq(wishlists.placeId, placeId)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: any) {
  const placeId = ctx?.params?.placeId as string;

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
