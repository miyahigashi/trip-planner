// apps/web/src/app/api/projects/[id]/selections/toggle/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/db/client";
import { users, projectMembers, projectSelections, projectCandidates } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

const Body = z.object({
  placeId: z.string().min(1),
  selected: z.boolean(),
  dayIndex: z.number().int().min(0).default(0),
  orderInDay: z.number().int().min(0).default(0),
});

async function byClerkId(clerkUserId: string) {
  const [r] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return r?.id ?? null;
}

// ★ 2番目の引数を使わず、URL から id を抜く
function projectIdFromUrl(req: Request): string | null {
  const path = new URL(req.url).pathname;
  const m = path.match(/\/api\/projects\/([^/]+)\/selections\/toggle$/);
  return m?.[1] ?? null;
}

export async function POST(req: Request) {
  const projectId = projectIdFromUrl(req);
  if (!projectId) {
    return NextResponse.json({ error: "Bad Request: project id" }, { status: 400 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await byClerkId(userId);
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { placeId, selected, dayIndex, orderInDay } = Body.parse(await req.json());

  // メンバー検査
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

  if (!member) return NextResponse.json({ error: "Not a project member" }, { status: 403 });

  if (selected) {
    // 確定ON → 候補から外して確定に入れる
    await db
      .delete(projectCandidates)
      .where(
        and(
          eq(projectCandidates.projectId, sql`${projectId}::uuid`),
          eq(projectCandidates.placeId, placeId)
        )
      );

    await db
      .insert(projectSelections)
      .values({
        projectId: sql`${projectId}::uuid`,
        placeId,
        dayIndex,
        orderInDay,
      })
      .onConflictDoNothing();
  } else {
    // 確定OFF
    await db
      .delete(projectSelections)
      .where(
        and(
          eq(projectSelections.projectId, sql`${projectId}::uuid`),
          eq(projectSelections.placeId, placeId)
        )
      );
  }

  return NextResponse.json({ ok: true });
}
