// apps/web/src/app/api/projects/[id]/selections/toggle/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, projectMembers, projectSelections } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

/**
 * 内部ユーザーIDを取得（Clerk → 自前 users.id）
 */
async function getInternalUserId(clerkUserId: string) {
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (!row.length) throw new Error("User not found");
  return row[0].id;
}

/**
 * そのプロジェクトのメンバーかチェック
 */
async function assertProjectMember(projectId: string, internalUserId: string) {
  const m = await db
    .select({ uid: projectMembers.userId })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, sql`${projectId}::uuid`),
        eq(projectMembers.userId, internalUserId)
      )
    )
    .limit(1);
  return m.length > 0;
}

type Body = { placeId?: string };

/**
 * 選択（しおり）トグル
 * - 既に選択済み: 削除
 * - 未選択: day_index = 0 の末尾に追加（order_in_day を採番）
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // ← Next.js 15 での正しい型
) {
  try {
    const { id: projectId } = await ctx.params;

    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const me = await getInternalUserId(clerkUserId);

    // メンバー権限チェック
    const ok = await assertProjectMember(projectId, me);
    if (!ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const placeId = (body?.placeId ?? "").trim();
    if (!placeId) {
      return NextResponse.json({ error: "placeId is required" }, { status: 400 });
    }

    // 既存確認
    const existing = await db
      .select({
        dayIndex: projectSelections.dayIndex,
        orderInDay: projectSelections.orderInDay,
      })
      .from(projectSelections)
      .where(
        and(
          eq(projectSelections.projectId, sql`${projectId}::uuid`),
          eq(projectSelections.placeId, placeId)
        )
      )
      .limit(1);

    // 既に確定済み → 解除（削除）
    if (existing.length) {
      await db
        .delete(projectSelections)
        .where(
          and(
            eq(projectSelections.projectId, sql`${projectId}::uuid`),
            eq(projectSelections.placeId, placeId)
          )
        );

      return NextResponse.json({ selected: false });
    }

    // 未選択 → 追加：day_index=0 の末尾 order_in_day を採番
    const MAX_RETRY = 3;
    for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
      // 末尾を取得（NULL は除外）
      const maxRow = await db
        .select({
          maxOrder: sql<number>`COALESCE(MAX(${projectSelections.orderInDay}), -1)`,
        })
        .from(projectSelections)
        .where(
          and(
            eq(projectSelections.projectId, sql`${projectId}::uuid`),
            eq(projectSelections.dayIndex, 0),
            sql`${projectSelections.orderInDay} IS NOT NULL`
          )
        );

      const nextOrder = (maxRow[0]?.maxOrder ?? -1) + 1;

      try {
        // placeId で Upsert（同一 place の再確定にも対応）
        await db
          .insert(projectSelections)
          .values({
            projectId: projectId as any, // drizzle uuid の場合 string OK
            placeId,
            dayIndex: 0,
            orderInDay: nextOrder,
          })
          .onConflictDoUpdate({
            target: [projectSelections.projectId, projectSelections.placeId],
            set: {
              dayIndex: 0,
              orderInDay: nextOrder,
            },
          });

        return NextResponse.json({
          selected: true,
          dayIndex: 0,
          orderInDay: nextOrder,
        });
      } catch (e: any) {
        // 一意制約衝突（別のリクエストが同時に nextOrder を取った）
        const code = e?.cause?.code ?? e?.code;
        if (code === "23505") {
          // 次のループで再採番
          continue;
        }
        // それ以外はエラーにする
        console.error("[selections/toggle] insert failed", e);
        return NextResponse.json({ error: "Insert failed" }, { status: 500 });
      }
    }

    // リトライ上限
    return NextResponse.json({ error: "Busy, try again" }, { status: 429 });
  } catch (e) {
    console.error("[selections/toggle] fatal", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
