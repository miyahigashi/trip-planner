// apps/web/src/app/api/projects/[id]/candidates/vote/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq, sql, count } from "drizzle-orm";

import { db } from "@/db/client";
import {
  users,
  projectMembers,
  projectCandidateVotes,
} from "@/db/schema";

/**
 * POST /api/projects/:id/candidates/vote
 * body: { placeId: string; op: "add" | "remove" }  // "add"=賛成, "remove"=取り消し
 * 返却: { ok: true; voted: boolean; votes: number }
 */
export async function POST(req: Request, { params }: any) {
  try {
    const projectId = params.id as string;

    // --- auth ---
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 自分の users.id を取得（uuid）
    const meRow = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkId))
      .limit(1);
    const me = meRow[0]?.id;
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 401 });

    // 任意: プロジェクトメンバー確認
    const member = await db
      .select({ userId: projectMembers.userId })
      .from(projectMembers)
      .where(and(
        eq(projectMembers.projectId, sql`${projectId}::uuid`),
        eq(projectMembers.userId, sql`${me}::uuid`),
      ))
      .limit(1);
    if (!member.length) return NextResponse.json({ error: "Not a project member" }, { status: 403 });

    // --- body/qs 受け取りを頑健に ---
    let body: any = {};
    try { body = await req.json(); } catch { /* no-op */ }
    const url = new URL(req.url);
    const qsPlaceId = url.searchParams.get("placeId") ?? undefined;
    const qsAction  = url.searchParams.get("action") ?? undefined;

    const placeId = (body?.placeId as string | undefined) ?? qsPlaceId;
    // 両方の表現をサポート: op=add/remove, action=vote/unvote
    const rawOp = (body?.op as string | undefined) ?? (body?.action as string | undefined) ?? qsAction;
    const op: "add" | "remove" =
      rawOp === "remove" || rawOp === "unvote" ? "remove" : "add";

    if (!placeId || (op !== "add" && op !== "remove")) {
        return NextResponse.json(
            { error: "placeId and op(add|remove) are required" },
            { status: 400 }
        );
        }

    if (op === "add") {
      await db
        .insert(projectCandidateVotes)
        .values({
          projectId: sql`${projectId}::uuid`,
          placeId,
          userId: sql`${me}::uuid`,
        })
        .onConflictDoNothing(); // (project_id, place_id, user_id) 一意
    } else {
      await db
        .delete(projectCandidateVotes)
        .where(and(
          eq(projectCandidateVotes.projectId, sql`${projectId}::uuid`),
          eq(projectCandidateVotes.placeId, placeId),
          eq(projectCandidateVotes.userId, sql`${me}::uuid`),
        ));
    }

    // --- 集計と自分の状態を返す ---
    const [agg] = await db
      .select({ votes: count(projectCandidateVotes.userId) })
      .from(projectCandidateVotes)
      .where(and(
        eq(projectCandidateVotes.projectId, sql`${projectId}::uuid`),
        eq(projectCandidateVotes.placeId, placeId),
      ));

    const [mine] = await db
      .select({ ok: sql<boolean>`true` })
      .from(projectCandidateVotes)
      .where(and(
        eq(projectCandidateVotes.projectId, sql`${projectId}::uuid`),
        eq(projectCandidateVotes.placeId, placeId),
        eq(projectCandidateVotes.userId, sql`${me}::uuid`),
      ))
      .limit(1);

    return NextResponse.json({
      ok: true,
      voted: Boolean(mine),
      votes: Number(agg?.votes ?? 0),
    });
  } catch (e) {
    console.error("[candidates/vote] error", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}