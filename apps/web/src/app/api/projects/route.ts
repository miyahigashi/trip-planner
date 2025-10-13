// apps/web/src/app/api/projects/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, projects, projectMembers, projectPrefectures } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

/* ---------- helpers ---------- */
async function getInternalUserId(clerkUserId: string) {
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  if (!row.length) throw new Error("user not found in app users table");
  return row[0].id;
}

/* ---------- validation schema ---------- */
const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ProjectCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  startDate: DateStr.nullable().optional().or(z.literal("").transform(() => null)),
  endDate:   DateStr.nullable().optional().or(z.literal("").transform(() => null)),
  prefectures: z.array(z.string()).min(1),
  // ← もう使わないので invitees は定義しない（送られてきても無視したいなら .passthrough() を使う）
});

/* ---------- handler ---------- */
export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const ownerId = await getInternalUserId(clerkUserId);

    const json = await req.json();
    const body = ProjectCreateSchema.parse(json);

    const projectId = await db.transaction(async (tx) => {
      // 1) projects
      const [p] = await tx
        .insert(projects)
        .values({
          ownerId: sql`${ownerId}::uuid`,
          title: body.title,
          description: body.description ?? null,
          startDate: body.startDate ?? null,
          endDate: body.endDate ?? null,
        })
        .returning({ id: projects.id });

      // 2) prefectures
      await tx.insert(projectPrefectures).values(
        body.prefectures.map((pref) => ({ projectId: p.id, prefecture: pref })),
      );

      // 3) owner as member（ここだけ残す）
      await tx.insert(projectMembers).values({
        projectId: p.id,
        userId: sql`${ownerId}::uuid`,
        role: "owner",
        status: "active",
      });

      return p.id;
    });

    // 返り値は projectId のみ
    return NextResponse.json({ projectId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
