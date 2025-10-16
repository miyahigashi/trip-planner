// apps/web/src/app/api/projects/[id]/candidates/add/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/db/client";
import { users, projectMembers, projectCandidates } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

const Body = z.object({
  placeId: z.string().min(1),
});

async function byClerkId(clerkUserId: string) {
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return row[0]?.id ?? null;
}

// ★ ここがポイント：第2引数は { params: { id: string } } にする（Record は不可）
export async function POST(req: Request, ctx: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await byClerkId(userId);
  if (!me) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const projectId = ctx?.params?.id as string;
  const { placeId } = Body.parse(await req.json());

  // メンバー確認
  const [member] = await db
    .select({ uid: projectMembers.userId })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, sql`${projectId}::uuid`),
        eq(projectMembers.userId, sql`${me}::uuid`)
      )
    )
    .limit(1);

  if (!member) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  // 既存チェック
  const existing = await db
    .select({ id: projectCandidates.id })
    .from(projectCandidates)
    .where(
      and(
        eq(projectCandidates.projectId, sql`${projectId}::uuid`),
        eq(projectCandidates.placeId, placeId)
      )
    )
    .limit(1);

  if (!existing.length) {
    await db
      .insert(projectCandidates)
      .values({
        projectId: sql`${projectId}::uuid`,
        placeId,
        addedByUserId: sql`${me}::uuid`, // ← スキーマに合わせたカラム名
      })
      .onConflictDoNothing();
  }

  return NextResponse.json({ ok: true, created: existing.length ? 0 : 1 });
}
