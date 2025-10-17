import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { projectPrefectures, projectMembers } from "@/db/schema"; // ← schema 名はあなたの環境に合わせて
import { and, eq, inArray } from "drizzle-orm";

/** helper: Clerk の UserId → app の users.id を引く。既にあれば既存の関数を使ってOK */
async function getAppUserIdByClerkId(clerkUserId: string) {
  const rows = await db.query.users.findMany({
    where: (t, { eq }) => eq(t.clerkUserId, clerkUserId),
    columns: { id: true },
    limit: 1,
  });
  return rows[0]?.id ?? null;
}

/** 既存の prefectures を返す（任意。GET を使っているなら維持） */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await db
    .select({ prefecture: projectPrefectures.prefecture })
    .from(projectPrefectures)
    .where(eq(projectPrefectures.projectId, id));

  return NextResponse.json({ prefectures: rows.map((r) => r.prefecture) });
}

/** これが今回必要：PUT を実装 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  // 認証（必要なければ外してOK）
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const appUserId = await getAppUserIdByClerkId(userId);
  if (!appUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 権限チェック（プロジェクト参加者のみ更新可）
  const member = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, appUserId)))
    .limit(1);

  if (!member[0]) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ボディの検証
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const prefs = Array.isArray((body as any)?.prefectures)
    ? (body as any).prefectures.filter((x: any) => typeof x === "string" && x.trim())
    : null;

  if (!prefs || prefs.length < 1) {
    return NextResponse.json(
      { error: "prefectures must be a non-empty string[]"},
      { status: 400 }
    );
  }

  // 置き換え（全削除→一括挿入）
  await db.delete(projectPrefectures).where(eq(projectPrefectures.projectId, projectId));
  await db.insert(projectPrefectures).values(
    prefs.map((p: string) => ({
      projectId,
      prefecture: p,
    }))
  );

  return NextResponse.json({ ok: true, prefectures: prefs });
}

/** 任意: メソッド制限を明示（必要なら） */
// export const dynamic = "force-dynamic";
