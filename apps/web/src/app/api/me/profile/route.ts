import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

async function getInternalUserId(clerkUserId: string) {
  const row = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  return row[0]?.id ?? null;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await getInternalUserId(userId);
  if (!uid) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [p] = await db.select().from(userProfiles).where(eq(userProfiles.userId, uid)).limit(1);
  return NextResponse.json(p ?? { userId: uid, displayName: "", bio: "", avatarKey: null });
}

const Body = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarKey: z.string().nullable().optional(), // 先にアップロードしておいた GCS key を渡す
});

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await getInternalUserId(userId);
  if (!uid) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = Body.parse(await req.json());

  await db
    .insert(userProfiles)
    .values({ userId: uid, ...body })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: { ...body, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
