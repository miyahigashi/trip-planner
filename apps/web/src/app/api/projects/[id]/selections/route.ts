import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { projectSelections } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// 必要なら DB ドライバのために Node ランタイムを明示
export const runtime = "nodejs";

/* ---------------------------
   Zod Schemas
--------------------------- */
const Item = z.object({
  placeId: z.string().min(1),
  dayIndex: z.coerce.number().int().min(0).nullable().optional(),
  orderInDay: z.coerce.number().int().min(0).nullable().optional(),
  note: z.string().nullable().optional(),
});

const BulkBody = z.object({ items: z.array(Item).min(1) });
const SingleBody = Item; // 後方互換: 単発もOK

/* ---------------------------
   POST /api/projects/:id/selections
   - Bulk: { items: [{ placeId, dayIndex, orderInDay, note }, ...] }
   - Single (後方互換): { placeId, dayIndex?, orderInDay?, note? }
   すべて upsert（同一 (projectId, placeId) は day/order/note を更新）
--------------------------- */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  try {
    const json = await req.json().catch(() => ({}));

    // 1) まず bulk を試す
    let items: z.infer<typeof Item>[];
    const bulkParsed = BulkBody.safeParse(json);
    if (bulkParsed.success) {
      items = bulkParsed.data.items;
    } else {
      // 2) 単発として再パース
      const single = SingleBody.parse(json);
      items = [single];
    }

    // 3) upsert（衝突時は dayIndex/orderInDay/note を更新）
    for (const it of items) {
      await db
        .insert(projectSelections)
        .values({
          projectId,                    // uuid列なら string でOK（Drizzleがキャスト）
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
    // Zod の詳細を返してデバッグしやすく
    if (err?.issues) {
      return NextResponse.json(
        { error: "invalid_body", detail: err.issues },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}

/* ---------------------------
   DELETE /api/projects/:id/selections?placeId=XXXX
--------------------------- */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

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
          eq(projectSelections.projectId, projectId),
          eq(projectSelections.placeId, placeId)
        )
      );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
