// apps/web/src/app/api/projects/[id]/friends/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, friendships, userProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
  { params }: { params: Promise<{ id: string }> } // ← ここだけ変更
) {
  const { id } = await params; // ← await がポイント

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await byClerkId(userId);
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const accepted = await db
    .select({
      friendId: friendships.friendId,
      email: users.email,
      displayName: userProfiles.displayName,
      avatarKey: userProfiles.avatarKey,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.friendId, users.id))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(eq(friendships.userId, me), eq(friendships.status, "accepted")));

  const incoming = await db
    .select({
      friendId: friendships.userId,
      email: users.email,
      displayName: userProfiles.displayName,
      avatarKey: userProfiles.avatarKey,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.userId, users.id))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(eq(friendships.friendId, me), eq(friendships.status, "pending")));

  return NextResponse.json({ projectId: id, accepted, incoming });
}
