// POST { placeId: string, note: string }
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { projectSelections } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Body = { placeId?: string; note?: string | null };

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const { placeId, note } = (await req.json()) as Body;
  if (!placeId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  await db
    .update(projectSelections)
    .set({ note: note && note.trim() ? note : null })
    .where(and(eq(projectSelections.projectId, projectId), eq(projectSelections.placeId, placeId)));

  // 再検証（候補/確定/自分リストに表示があるなら）
  revalidatePath(`/projects/${projectId}/selections`);
  revalidatePath(`/projects/${projectId}/candidates`);
  revalidatePath(`/projects/${projectId}/my-wishes`);

  return NextResponse.json({ ok: true });
}
