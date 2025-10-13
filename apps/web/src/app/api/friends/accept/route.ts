// apps/web/src/app/api/friends/accept/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, friendships } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

async function byClerkId(clerkUserId: string) {
  const row = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  return row[0]?.id ?? null;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await byClerkId(userId);
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { friendId } = z.object({ friendId: z.string().uuid() }).parse(await req.json());

  // 相手→自分に pending 行があること
  const [pending] = await db
    .select()
    .from(friendships)
    .where(and(eq(friendships.userId, friendId), eq(friendships.friendId, me)))
    .limit(1);

  if (!pending || pending.status !== "pending") {
    return NextResponse.json({ error: "リクエストがありません" }, { status: 400 });
  }

  // 相手→自分 を accepted に
  await db
    .update(friendships)
    .set({ status: "accepted" })
    .where(and(eq(friendships.userId, friendId), eq(friendships.friendId, me)));

  // 自分→相手 の accepted 行を作成（無ければ）
  await db
    .insert(friendships)
    .values({ userId: me, friendId, status: "accepted", requestedBy: pending.requestedBy })
    .onConflictDoUpdate({
      target: [friendships.userId, friendships.friendId],
      set: { status: "accepted" },
    });

  return NextResponse.json({ ok: true });
}
