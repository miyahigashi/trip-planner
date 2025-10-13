// apps/web/src/app/api/projects/[id]/members/bulk/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, projectMembers, friendships } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

async function getInternalUserId(clerkUserId: string) {
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  if (!row.length) throw new Error("user not found");
  return row[0].id;
}

const Body = z.object({
  userIds: z.array(z.string().uuid()).min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ← Next.js 15: params は Promise
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await getInternalUserId(clerkUserId);
  const { id: projectId } = await params; // ← await が必須
  const { userIds } = Body.parse(await req.json());

  // セーフティ: 本当に「自分の友だち(accepted)」に限定
  const a = await db
    .select({ uid: friendships.friendId })
    .from(friendships)
    .where(and(eq(friendships.userId, me), eq(friendships.status, "accepted")));

  const b = await db
    .select({ uid: friendships.userId })
    .from(friendships)
    .where(and(eq(friendships.friendId, me), eq(friendships.status, "accepted")));

  const allowedSet = new Set([...a, ...b].map((r) => r.uid));
  const targetIds = userIds.filter((id) => allowedSet.has(id));
  if (targetIds.length === 0) {
    return NextResponse.json({ added: 0 });
  }

  const values: (typeof projectMembers.$inferInsert)[] = targetIds.map((uid) => ({
    projectId,
    userId: uid,
    role: "editor", // スキーマの union（viewer/editor/owner 等）に合わせる
    status: "invited",
  }));

  await db.insert(projectMembers).values(values).onConflictDoNothing();

  return NextResponse.json({ added: values.length });
}
