// apps/web/src/app/api/projects/[id]/candidates/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { projectCandidates } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { placeId } = await req.json();
  if (!placeId) return NextResponse.json({ error: "placeId required" }, { status: 400 });
  await db.insert(projectCandidates)
    .values({ projectId: params.id, placeId })
    .onConflictDoNothing();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("placeId");
  if (!placeId) return NextResponse.json({ error: "placeId required" }, { status: 400 });

  await db.delete(projectCandidates)
    .where(and(eq(projectCandidates.projectId, params.id), eq(projectCandidates.placeId, placeId)));

  return NextResponse.json({ ok: true });
}
