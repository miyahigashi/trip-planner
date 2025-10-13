// apps/web/src/app/api/projects/[id]/invites/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, projectInvites } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { sendInviteEmail } from "@/lib/mailer";

const Body = z.object({
  emails: z.array(z.string().email()).min(1),
  role: z.enum(["viewer", "editor"]).default("editor"),
});

function normalize(e: string) { return e.trim().toLowerCase(); }
function originFrom(req: Request) {
  const u = new URL(req.url);
  return (process.env.APP_ORIGIN ?? `${u.protocol}//${u.host}`).replace(/\/$/, "");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ← Promise に
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;          // ← await して取り出す
  const { emails, role } = Body.parse(await req.json());
  const origin = originFrom(req);

  const normalized = emails.map(normalize);

  // 既存ユーザーのメールはスキップ（友だち追加で対応する方針）
  const existing = await db
    .select({ email: users.email })
    .from(users)
    .where(inArray(users.email, normalized));

  const existingSet = new Set(existing.map((r) => r.email.toLowerCase()));
  const guests = normalized.filter((e) => !existingSet.has(e));

  let invitesCreated = 0;

  for (const email of guests) {
    const already = await db
      .select({ id: projectInvites.id })
      .from(projectInvites)
      .where(and(
        eq(projectInvites.projectId, projectId),
        sql`lower(${projectInvites.email}) = ${email}`,
      ))
      .limit(1);

    if (already.length) continue;

    const token = crypto.randomUUID();
    await db.insert(projectInvites).values({
      projectId,
      email,
      token,
      role,
    });
    invitesCreated++;

    sendInviteEmail({
      to: email,
      projectTitle: "プロジェクト招待",
      acceptUrl: `${origin}/invite/${token}`,
    }).catch((e) => console.warn("invite mail failed:", e));
  }

  return NextResponse.json({
    invitesCreated,
    skippedExisting: existingSet.size,
  });
}
