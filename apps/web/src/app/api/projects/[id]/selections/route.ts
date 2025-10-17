// apps/web/src/app/api/projects/[id]/selections/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { projectSelections, projectCandidates } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm"; // ← ne を追加

const LooseItem = z.object({
  placeId: z.string().min(1),
  dayIndex: z.unknown().optional(),
  orderInDay: z.unknown().optional(),
  note: z.string().nullable().optional(),
});
const LooseBulk = z.object({ items: z.array(LooseItem).min(1) });

const toInt = (v: unknown, fallback = 0) => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : fallback;
};

export async function POST(req: NextRequest, ctx: any) {
  const projectId = (ctx?.params?.id as string) ?? "";

  try {
    // Body は一度だけ読む
    const raw = await req.text();
    const json = raw ? JSON.parse(raw) : {};

    // bulk/単発の両対応で正規化
    const items =
      LooseBulk.safeParse(json).success
        ? (json.items as any[]).map((it) => ({
            placeId: String(it.placeId),
            dayIndex: toInt(it.dayIndex, 0),
            orderInDay: toInt(it.orderInDay, 0),
            note: (it.note ?? "") as string, // NOT NULL なら空文字に寄せる
          }))
        : [
            (() => {
              const it = LooseItem.parse(json);
              return {
                placeId: it.placeId,
                dayIndex: toInt(it.dayIndex, 0),
                orderInDay: toInt(it.orderInDay, 0),
                note: it.note ?? "",
              };
            })(),
          ];

    // 衝突回避のため、同スロットを先にクリアしてから upsert（1トランザクション）
    await db.transaction(async (tx) => {
      for (const it of items) {
        // 1) そのスロットに既にある「別の place」を削除（ユニーク制約回避）
        await tx
          .delete(projectSelections)
          .where(
            and(
              eq(projectSelections.projectId, projectId),
              eq(projectSelections.dayIndex, it.dayIndex),
              eq(projectSelections.orderInDay, it.orderInDay),
              ne(projectSelections.placeId, it.placeId) // 自分自身は消さない
            )
          );

        // 2) FK用（あれば）の候補エントリを先に作っておく
        await tx
          .insert(projectCandidates)
          .values({ projectId, placeId: it.placeId })
          .onConflictDoNothing();

        // 3) placeId キーで upsert（位置・メモを更新）
        await tx
          .insert(projectSelections)
          .values({
            projectId,
            placeId: it.placeId,
            dayIndex: it.dayIndex,
            orderInDay: it.orderInDay,
            note: it.note,
          })
          .onConflictDoUpdate({
            target: [projectSelections.projectId, projectSelections.placeId],
            set: {
              dayIndex: it.dayIndex,
              orderInDay: it.orderInDay,
              note: it.note,
            },
          });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[selections POST] failed", e);
    return NextResponse.json(
      { error: "insert_failed", info: e?.detail ?? e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: any) {
  const projectId = (ctx?.params?.id as string) ?? "";
  try {
    const placeId = new URL(req.url).searchParams.get("placeId");
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
  } catch (e: any) {
    const info = e?.code
      ? { code: e.code, detail: e.detail, constraint: e.constraint }
      : e?.message ?? String(e);
    return NextResponse.json({ error: "delete_failed", info }, { status: 500 });
  }
}
