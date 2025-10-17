// apps/web/src/app/api/projects/[id]/friends/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, friendships, userProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Clerk userId → アプリ内 users.id へ
async function byClerkId(clerkUserId: string) {
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return row[0]?.id ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ★ Next.js 15 の Promise params
) {
  // 使わなくても await は必須
  const { id } = await params;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await byClerkId(userId);
  if (!me) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 1) 自分→相手 の accepted
  const a = await db
    .select({
      friendId: friendships.friendId,
      email: users.email,
      displayName: userProfiles.displayName,
      avatarKey: userProfiles.avatarKey,
    })
    .from(friendships)
    .innerJoin(users, eq(users.id, friendships.friendId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(eq(friendships.userId, me), eq(friendships.status, "accepted")));

  // 2) 相手→自分 の accepted
  const b = await db
    .select({
      friendId: friendships.userId,
      email: users.email,
      displayName: userProfiles.displayName,
      avatarKey: userProfiles.avatarKey,
    })
    .from(friendships)
    .innerJoin(users, eq(users.id, friendships.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(eq(friendships.friendId, me), eq(friendships.status, "accepted")));

  // 3) pending（相手からのリクエストのみ表示したい場合）
  const incoming = await db
    .select({
      friendId: friendships.userId,
      email: users.email,
      displayName: userProfiles.displayName,
      avatarKey: userProfiles.avatarKey,
    })
    .from(friendships)
    .innerJoin(users, eq(users.id, friendships.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(eq(friendships.friendId, me), eq(friendships.status, "pending")));

  // 両方向 accepted を結合・重複排除（念のため）
  const map = new Map<string, (typeof a)[number]>();
  for (const r of [...a, ...b]) map.set(r.friendId, r);
  const accepted = Array.from(map.values());

  return NextResponse.json({ projectId: id, accepted, incoming });
}
