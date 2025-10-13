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

  // ← ここを email 固定 → to(メールorハンドル) に変更
  const { to } = z.object({ to: z.string().trim().min(1) }).parse(await req.json());

  // メールかどうか判定（超ゆるめでOK）
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);
  const handle = to.replace(/^@/, "").toLowerCase();

  // 宛先ユーザー解決（大小無視で一致）
  const targetRow = isEmail
    ? await db
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.email}) = ${to.toLowerCase()}`)
        .limit(1)
    : await db
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.handle}) = ${handle}`) // handle列を使う
        .limit(1);

  if (!targetRow.length) return NextResponse.json({ error: "相手が見つかりません" }, { status: 404 });

  const friendId = targetRow[0].id;
  if (friendId === me) return NextResponse.json({ error: "自分は追加できません" }, { status: 400 });

  // 既存チェック（自分→相手 も 相手→自分 も）
  const [ex] = await db
    .select({ id: friendships.userId })
    .from(friendships)
    .where(
      or(
        and(eq(friendships.userId, me), eq(friendships.friendId, friendId)),
        and(eq(friendships.userId, friendId), eq(friendships.friendId, me))
      )
    )
    .limit(1);

  if (ex) return NextResponse.json({ ok: true }); // 冪等

  await db.insert(friendships).values({
    userId: me,
    friendId,
    status: "pending",
    requestedBy: me,
  });

  return NextResponse.json({ ok: true });
}
