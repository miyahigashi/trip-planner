// apps/web/src/app/api/projects/[id]/candidates/vote/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { projectCandidateVotes } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getOrCreateAppUserId } from "@/lib/getAppUserId";

export const dynamic = "force-dynamic";

type Body = { placeId?: string; op?: "add" | "remove" };

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ★ Promise で受ける
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { placeId, op } = (await req.json()) as Body;
    if (!placeId || (op !== "add" && op !== "remove")) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { id: projectId } = await params; // ★ await してから取り出す
    const appUserId = await getOrCreateAppUserId(clerkUserId);

    if (op === "add") {
      await db
        .insert(projectCandidateVotes)
        .values({ projectId, placeId, userId: appUserId })
        .onConflictDoNothing();
    } else {
      await db
        .delete(projectCandidateVotes)
        .where(
          and(
            eq(projectCandidateVotes.projectId, projectId),
            eq(projectCandidateVotes.placeId, placeId),
            eq(projectCandidateVotes.userId, appUserId)
          )
        )
        .returning({ userId: projectCandidateVotes.userId });
    }

    // votes（count）
    const voteRows = await db
      .select({ votes: sql<number>`count(*)` })
      .from(projectCandidateVotes)
      .where(
        and(
          eq(projectCandidateVotes.projectId, projectId),
          eq(projectCandidateVotes.placeId, placeId)
        )
      );
    const votes = Number(voteRows[0]?.votes ?? 0);

    // 自分が投票済みか（exists）
    const meRows = await db
        .select({
            ok: sql<boolean>`exists(
            select 1 from ${projectCandidateVotes}
            where ${projectCandidateVotes.projectId} = ${projectId}
                and ${projectCandidateVotes.placeId} = ${placeId}
                and ${projectCandidateVotes.userId} = ${appUserId}
            )`,
        })
        .from(projectCandidateVotes); // ← 付けると型が配列になって安定

    const votedByMe = !!meRows[0]?.ok;

    // 保険で再検証
    revalidatePath(`/projects/${projectId}/candidates`);
    revalidatePath(`/projects/${projectId}/my-wishes`);
    revalidatePath(`/projects/${projectId}/selected`);

    return NextResponse.json({ voted: votedByMe, votes });
  } catch (e) {
    console.error("[vote] error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
