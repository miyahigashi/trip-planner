import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { projects, projectMembers, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export const runtime = "nodejs";
// 可能ならDBに近いリージョンへ
// export const preferredRegion = "sin1" | "hnd1";

async function byClerkId(clerkUserId: string) {
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return row[0]?.id ?? null;
}

// 参加中プロジェクトを返す（必要最低限の項目）
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await byClerkId(userId);
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      startDate: projects.startDate,
      endDate: projects.endDate,
      role: projectMembers.role,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(and(
      eq(projectMembers.userId, sql`${me}::uuid`),
      // 参加中のみ。status があれば絞る
      // eq(projectMembers.status, "active")
      sql`true`
    ))
    .orderBy(projects.createdAt);

  return NextResponse.json(rows);
}
