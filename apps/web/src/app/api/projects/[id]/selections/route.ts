import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { projectSelections } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// POST { ops: [{ placeId, dayIndex, orderInDay }, ...] }
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const ops: { placeId: string; dayIndex: number; orderInDay: number }[] =
      Array.isArray(body?.ops) ? body.ops : [];

    if (!ops.length) return NextResponse.json({ ok: true });

    // トランザクションでまとめて更新
    await db.transaction(async (tx) => {
      for (const op of ops) {
        await tx
          .update(projectSelections)
          .set({
            dayIndex: op.dayIndex,
            orderInDay: op.orderInDay,
          })
          .where(
            sql`${projectSelections.projectId} = ${id}::uuid AND ${projectSelections.placeId} = ${op.placeId}`
          );
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
