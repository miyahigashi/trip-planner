import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { projects, projectMembers, projectPrefectures, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // users.id を引く（内部UUID）
  const u = await db.select().from(users).where(eq(users.clerkUserId, session.userId)).limit(1);
  if (!u[0]) return NextResponse.json({ error: "user not found" }, { status: 404 });

  // 1. プロジェクト作成
  const [p] = await db.insert(projects).values({
    ownerId: u[0].id,
    title: "テスト旅行",
  }).returning();

  // 2. 都道府県を2つくらい設定（例：北海道/東京）
  await db.insert(projectPrefectures).values([
    { projectId: p.id, prefecture: "北海道" },
    { projectId: p.id, prefecture: "東京都" },
  ]);

  // 3. メンバー（自分）を参加
  await db.insert(projectMembers).values({
    projectId: p.id, userId: u[0].id, role: "owner", status: "active",
  });

  return NextResponse.json({ projectId: p.id });
}
