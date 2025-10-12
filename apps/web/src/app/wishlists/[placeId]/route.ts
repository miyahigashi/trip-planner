// apps/web/src/app/api/wishlists/[placeId]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { wishlists } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ensureDbUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function OPTIONS(req: Request, { params }: { params: { placeId: string } }) {
  const origin = req.headers.get("origin") ?? "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  headers["Access-Control-Allow-Credentials"] = "true";
  return new Response(null, { status: 204, headers });
}

// 既存の DELETE はそのまま

export async function PATCH(req: Request, { params }: { params: { placeId: string } }) {
  try {
    const user = await ensureDbUser();
    const { placeId } = params;

    const body = await req.json().catch(() => ({}));
    // ""（空文字）は null で保存する運用にします
    const note: string | null =
      typeof body?.note === "string" ? (body.note.trim() === "" ? null : body.note) : null;

    const result = await db
      .update(wishlists)
      .set({ note })
      .where(and(eq(wishlists.userId, user.id), eq(wishlists.placeId, placeId)))
      .returning({ placeId: wishlists.placeId, note: wishlists.note });

    if (result.length === 0) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, item: result[0] });
  } catch (e: any) {
    const msg = String(e ?? "");
    const isAuthErr = /UNAUTHENTICATED|Unauthorized|Unauthenticated|No\s*session/i.test(msg);
    return NextResponse.json({ ok: false, error: msg }, { status: isAuthErr ? 401 : 500 });
  }
}
