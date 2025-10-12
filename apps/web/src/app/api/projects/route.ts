// apps/web/src/app/api/projects/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import {
  users, projects, projectMembers, projectPrefectures, projectInvites,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

// Clerk の userId -> 内部 users.id
async function getInternalUserId(clerkUserId: string) {
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  if (!row.length) throw new Error("user not found in app users table");
  return row[0].id;
}

// 日付(YYYY-MM-DD)の文字列を受ける
const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Body = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  startDate: DateStr.nullable().optional().or(z.literal("").transform(() => null)),
  endDate:   DateStr.nullable().optional().or(z.literal("").transform(() => null)),
  prefectures: z.array(z.string()).min(1),
  invitees: z.array(z.string().email()).optional().default([]),
});

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownerId = await getInternalUserId(clerkUserId);

    // ← ここが重要：リクエストJSONをZodでパース
    const json = await req.json();
    const body = Body.parse(json);

    const result = await db.transaction(async (tx) => {
      // projects
      const [p] = await tx
        .insert(projects)
        .values({
          ownerId: sql`${ownerId}::uuid`,
          title: body.title,
          description: body.description ?? null,
          // Drizzle の date() カラムは string をそのまま入れるのが楽
          startDate: body.startDate ?? null,
          endDate: body.endDate ?? null,
        })
        .returning({ id: projects.id });

      // prefectures
      await tx.insert(projectPrefectures).values(
        body.prefectures.map((pref) => ({ projectId: p.id, prefecture: pref })),
      );

      // owner as member
      await tx.insert(projectMembers).values({
        projectId: p.id,
        userId: sql`${ownerId}::uuid`,
        role: "owner",
        status: "active",
      });

      // invites (任意)
      if (body.invitees.length) {
        await tx.insert(projectInvites).values(
        body.invitees.map((email) => ({
            projectId: p.id,                // string (uuid)
            email,                          // string
            token: crypto.randomUUID(),     // string
            role: "editor" as const,        // ← enum/unionなら as const で安定
        }))
        );
    }

      return p.id;
    });

    return NextResponse.json({ projectId: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
