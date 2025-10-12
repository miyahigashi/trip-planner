// apps/web/src/app/api/projects/[id]/candidates/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { projectCandidates } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

/** POST /api/projects/:id/candidates  Body: { placeId: string } */
export async function POST(req: Request, ctx: any) {
  // ctx.params の存在と型をここで狭める
  const { id } = (ctx as { params: { id: string } }).params;

  try {
    const body = await req.json().catch(() => ({}));
    const { placeId } = z.object({ placeId: z.string().min(1) }).parse(body);

    await db
      .insert(projectCandidates)
      .values({
        projectId: sql`${id}::uuid`, // uuid に明示キャスト
        placeId,
      })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const msg =
      err?.issues?.[0]?.message ?? err?.message ?? "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/** DELETE /api/projects/:id/candidates?placeId=XXXX */
export async function DELETE(req: Request, ctx: any) {
  const { id } = (ctx as { params: { id: string } }).params;

  try {
    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get("placeId");
    if (!placeId) {
      return NextResponse.json({ error: "placeId required" }, { status: 400 });
    }

    await db
      .delete(projectCandidates)
      .where(
        and(
          eq(projectCandidates.projectId, sql`${id}::uuid`),
          eq(projectCandidates.placeId, placeId)
        )
      );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const msg = err?.message ?? "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
