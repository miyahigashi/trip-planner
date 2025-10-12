import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { projectSelections } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

/** POST /api/projects/:id/selections  Body: { placeId: string, dayIndex?: number|null, orderInDay?: number|null, note?: string|null } */
export async function POST(req: Request, ctx: any) {
  const { id } = (ctx as { params: { id: string } }).params;

  try {
    const body = await req.json().catch(() => ({}));
    const schema = z.object({
      placeId: z.string().min(1),
      dayIndex: z.number().int().nullable().optional(),
      orderInDay: z.number().int().nullable().optional(),
      note: z.string().nullable().optional(),
    });
    const { placeId, dayIndex = null, orderInDay = null, note = null } =
      schema.parse(body);

    await db
      .insert(projectSelections)
      .values({
        projectId: sql`${id}::uuid`,
        placeId,
        dayIndex,
        orderInDay,
        note,
      })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const msg =
      err?.issues?.[0]?.message ?? err?.message ?? "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/** DELETE /api/projects/:id/selections?placeId=XXXX */
export async function DELETE(req: Request, ctx: any) {
  const { id } = (ctx as { params: { id: string } }).params;

  try {
    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get("placeId");
    if (!placeId) {
      return NextResponse.json({ error: "placeId required" }, { status: 400 });
    }

    await db
      .delete(projectSelections)
      .where(
        and(
          eq(projectSelections.projectId, sql`${id}::uuid`),
          eq(projectSelections.placeId, placeId)
        )
      );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const msg = err?.message ?? "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
