// apps/web/src/app/api/projects/[id]/members/[userId]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, projectMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";

async function appUserIdByClerk(clerkId: string) {
  const row = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkId))
    .limit(1);
  return row[0]?.id ?? null;
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; userId: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, userId } = await ctx.params;
  const me = await appUserIdByClerk(clerkUserId);
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // （必要なら）自分を外すのを禁止したい場合はここでチェック
  // if (userId === me) return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });

  // このプロジェクトのメンバーであることの軽い検証（削除権限）
  const mine = await db.select({ id: projectMembers.userId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, me)))
    .limit(1);
  if (!mine.length) return NextResponse.json({ error: "No permission" }, { status: 403 });

  const deleted = await db.delete(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .returning({ userId: projectMembers.userId });

  return NextResponse.json({ removed: deleted.length });
}
