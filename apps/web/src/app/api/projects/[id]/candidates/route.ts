import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, projectMembers, projectCandidates, projectSelections } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

// URL から projectId を安全に抜く（Next 15 の型検証回避）
function projectIdFrom(req: Request): string {
  const u = new URL(req.url);
  const after = u.pathname.split("/api/projects/")[1] ?? "";
  return after.split("/")[0] ?? "";
}

async function getInternalUserId(clerkUserId: string) {
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return row[0]?.id ?? null;
}

async function assertMember(projectId: string, userId: string) {
  const r = await db
    .select({ uid: projectMembers.userId })
    .from(projectMembers)
    .where(and(
      eq(projectMembers.projectId, sql`${projectId}::uuid`),
      eq(projectMembers.userId, userId)
    ))
    .limit(1);
  return r.length > 0;
}

// ---------- 候補に追加 ----------
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = projectIdFrom(req);
  if (!projectId) return NextResponse.json({ error: "Invalid project id" }, { status: 400 });

  const me = await getInternalUserId(userId);
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!(await assertMember(projectId, me))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({})) as { placeId?: string };
  const placeId = (body.placeId ?? "").trim();
  if (!placeId) return NextResponse.json({ error: "placeId is required" }, { status: 400 });

  await db
    .insert(projectCandidates)
    .values({ projectId: projectId as any, placeId })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}

// ---------- 候補を削除（必要なら確定も同時に削除） ----------
export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = projectIdFrom(req);
  if (!projectId) return NextResponse.json({ error: "Invalid project id" }, { status: 400 });

  const me = await getInternalUserId(userId);
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!(await assertMember(projectId, me))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const u = new URL(req.url);
  // placeId はクエリでも JSON でもOK（使いやすい方で）
  const placeIdFromQuery = u.searchParams.get("placeId") ?? undefined;
  const alsoUnselectQ = u.searchParams.get("alsoUnselect");
  const alsoUnselectFromQuery =
    alsoUnselectQ === "1" || alsoUnselectQ === "true";

  let placeId = placeIdFromQuery?.trim();
  let alsoUnselect = alsoUnselectFromQuery;

  if (!placeId) {
    const body = await req.json().catch(() => ({})) as { placeId?: string; alsoUnselect?: boolean };
    placeId = (body.placeId ?? "").trim();
    if (typeof body.alsoUnselect === "boolean") alsoUnselect = body.alsoUnselect;
  }

  if (!placeId) return NextResponse.json({ error: "placeId is required" }, { status: 400 });

  // 候補から削除
  await db
    .delete(projectCandidates)
    .where(and(
      eq(projectCandidates.projectId, sql`${projectId}::uuid`),
      eq(projectCandidates.placeId, placeId)
    ));

  // もしフラグが true なら、確定も解除
  if (alsoUnselect) {
    await db
      .delete(projectSelections)
      .where(and(
        eq(projectSelections.projectId, sql`${projectId}::uuid`),
        eq(projectSelections.placeId, placeId)
      ));
  }

  return NextResponse.json({ ok: true, alsoUnselect: !!alsoUnselect });
}
