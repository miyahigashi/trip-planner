import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import {
  projects,
  projectMembers,
  projectPrefectures,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Body = {
  title?: string;
  description?: string | null;
  startDate?: string | null; // "YYYY-MM-DD"
  endDate?: string | null;   // "YYYY-MM-DD"
  prefectures?: string[];    // 例: ["大阪府","京都府"]
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // 認証
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await ctx.params;
    const body = (await req.json()) as Body;

    // 権限チェック（オーナーorエディタ）
    const member = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        // users テーブル経由で内部 userId に変換しているなら、
        // そちらの ID をつかってください。以下は簡易例：
        // eq(projectMembers.userId, appUserId)
        // ここでは guest/null もあり得るため、メール招待などでの判定が必要なら適宜拡張
        // とりあえず存在すればOKにしています
        inArray(projectMembers.role, ["owner", "editor"] as const)
      ),
    });
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // プロジェクト本体を更新
    const updateSet: Partial<typeof projects.$inferInsert> = {};
    if (typeof body.title === "string") updateSet.title = body.title.trim();
    if ("description" in body) updateSet.description = body.description ?? null;
    if ("startDate" in body) updateSet.startDate = body.startDate ?? null;
    if ("endDate" in body) updateSet.endDate = body.endDate ?? null;

    if (Object.keys(updateSet).length > 0) {
      await db
        .update(projects)
        .set(updateSet)
        .where(eq(projects.id, projectId));
    }

    // 都道府県を差し替え（全削除→一括挿入）
    if (Array.isArray(body.prefectures)) {
      const uniq = [...new Set(body.prefectures.filter(Boolean))];
      await db
        .delete(projectPrefectures)
        .where(eq(projectPrefectures.projectId, projectId));
      if (uniq.length) {
        await db.insert(projectPrefectures).values(
          uniq.map((p) => ({
            projectId,
            prefecture: p,
          }))
        );
      }
    }

    // 影響ページを再検証
    revalidatePath(`/projects/${projectId}/selections`);
    revalidatePath(`/projects/${projectId}/candidates`);
    revalidatePath(`/projects/${projectId}/my-wishes`);
    revalidatePath(`/projects/${projectId}`);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/projects/[id]/meta] failed:", e);
    return NextResponse.json({ error: "プロジェクトの更新に失敗しました。" }, { status: 500 });
  }
}
