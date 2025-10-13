// apps/web/src/app/invite/[token]/route.ts
import { db } from "@/db/client";
import { projectInvites, projectMembers } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> } // ← Next.js 15: Promise で受ける
) {
  const { token } = await params; // ← まず await で展開

  const { userId } = await auth();
  if (!userId) {
    // 未ログインならサインインへ（戻り先にこの招待URLを指定）
    return redirect(`/sign-in?next=/invite/${token}`);
  }

  const [inv] = await db
    .select()
    .from(projectInvites)
    .where(eq(projectInvites.token, token))
    .limit(1);

  if (!inv) {
    return new Response("無効な招待リンクです", { status: 404 });
  }

  // role はスキーマに合わせる（viewer 以外は editor として扱う）
  const role: "viewer" | "editor" = inv.role === "viewer" ? "viewer" : "editor";

  // 参加レコードを追加（既にあればスキップ）
  await db
    .insert(projectMembers)
    .values({
      projectId: inv.projectId as string,
      userId: userId,            // 上で未ログインを弾いているので string 扱いでOK
      role,
      status: "active",
    })
    .onConflictDoNothing();

  // 招待を使用済みに（必要に応じて null チェックなど加えてOK）
  await db
    .update(projectInvites)
    .set({ claimedByUserId: userId })
    .where(eq(projectInvites.id, inv.id));

  // 参加後はプロジェクトへリダイレクト
  redirect(`/projects/${inv.projectId}`);
}
