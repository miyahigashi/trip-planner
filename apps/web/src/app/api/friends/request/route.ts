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

  const body = z.object({ email: z.string().email() }).parse(await req.json());
  const targetRow = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
  if (!targetRow.length) return NextResponse.json({ error: "相手が見つかりません" }, { status: 404 });

  const friendId = targetRow[0].id;
  if (friendId === me) return NextResponse.json({ error: "自分は追加できません" }, { status: 400 });

  // 既存チェック
  const [ex] = await db.select().from(friendships).where(and(eq(friendships.userId, me), eq(friendships.friendId, friendId))).limit(1);
  if (ex) return NextResponse.json({ ok: true }); // 冪等

  await db.insert(friendships).values({ userId: me, friendId, status: "pending", requestedBy: me });
  return NextResponse.json({ ok: true });
}
