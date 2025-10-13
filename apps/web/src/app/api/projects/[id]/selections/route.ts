// apps/web/src/app/api/projects/[id]/selections/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { projectSelections } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";

// ---- Schemas ----
const Item = z.object({
  placeId: z.string().min(1),
  dayIndex: z.coerce.number().int().min(0).nullable().optional(),
  orderInDay: z.coerce.number().int().min(0).nullable().optional(),
  note: z.string().nullable().optional(),
});
const BulkBody = z.object({ items: z.array(Item).min(1) });
const SingleBody = Item;

// ---- POST: bulk でも単発でもOK（upsert）----
export async function POST(req: Request, ctx: any) {
  const projectId = ctx?.params?.id as string;

  try {
    const json = await req.json().catch(() => ({}));
    const parsed = BulkBody.safeParse(json);
    const items = parsed.success ? parsed.data.items : [SingleBody.parse(json)];

    for (const it of items) {
      await db
        .insert(projectSelections)
        .values({
          projectId, // string→uuid のキャストは Drizzle 側で行われます
          placeId: it.placeId,
          dayIndex: it.dayIndex ?? null,
          orderInDay: it.orderInDay ?? null,
          note: it.note ?? null,
        })
        .onConflictDoUpdate({
          target: [projectSelections.projectId, projectSelections.placeId],
          set: {
            dayIndex: it.dayIndex ?? null,
            orderInDay: it.orderInDay ?? null,
            note: it.note ?? null,
          },
        });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json(
        { error: "invalid_body", detail: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ---- DELETE: placeId クエリで削除 ----
export async function DELETE(req: Request, ctx: any) {
  const projectId = ctx?.params?.id as string;

  try {
    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get("placeId");
    if (!placeId) {
      return NextResponse.json({ error: "placeId required" }, { status: 400 });
    }

    await db
      .delete(projectSelections)
      .where(
        and(eq(projectSelections.projectId, projectId), eq(projectSelections.placeId, placeId))
      );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
