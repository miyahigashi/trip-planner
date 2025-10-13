// apps/web/src/app/api/friends/request/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, friendships } from "@/db/schema";
import { and, eq, or, sql } from "drizzle-orm";
import { z } from "zod";

async function byClerkId(clerkUserId: string) {
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return row[0]?.id ?? null;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await byClerkId(userId);
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { to } = z.object({ to: z.string().trim().min(1) }).parse(await req.json());

  const raw = to.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
  const emailLow = isEmail ? raw.toLowerCase() : null;
  const handleLow = !isEmail ? raw.replace(/^@/, "").toLowerCase() : null;

  // 宛先解決（lower一致）
  const targetRow = await db
    .select({ id: users.id })
    .from(users)
    .where(
      isEmail
        ? sql`lower(${users.email})  = ${emailLow}`
        : sql`lower(${users.handle}) = ${handleLow}`
    )
    .limit(1);

  if (!targetRow.length) {
    return NextResponse.json({ error: "相手が見つかりません" }, { status: 404 });
  }

  const friendId = targetRow[0].id;
  if (friendId === me) {
    return NextResponse.json({ error: "自分は追加できません" }, { status: 400 });
  }

  // 相手→自分の pending が既にあるなら、即「承認」に昇格
  const reciprocal = await db
    .select({ userId: friendships.userId })
    .from(friendships)
    .where(and(eq(friendships.userId, friendId), eq(friendships.friendId, me)))
    .limit(1);

  if (reciprocal.length) {
    await db
      .update(friendships)
      .set({ status: "accepted" })
      .where(and(eq(friendships.userId, friendId), eq(friendships.friendId, me)));
    return NextResponse.json({ ok: true, result: "autoAccepted" });
  }

  // 既存（自分→相手 or 相手→自分）なら冪等に成功扱い
  const exists = await db
    .select({ userId: friendships.userId })
    .from(friendships)
    .where(
      or(
        and(eq(friendships.userId, me), eq(friendships.friendId, friendId)),
        and(eq(friendships.userId, friendId), eq(friendships.friendId, me))
      )
    )
    .limit(1);

  if (exists.length) {
    return NextResponse.json({ ok: true, result: "already" });
  }

  // 申請作成（PK競合でも落ちないように）
  await db
    .insert(friendships)
    .values({ userId: me, friendId, status: "pending", requestedBy: me })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true, result: "created" });
}
