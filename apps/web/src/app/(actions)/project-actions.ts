// apps/web/src/app/(actions)/project-actions.ts
"use server";
"use server";
import { db } from "@/db/client";
import { projectSelections } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function selectPlace(projectId: string, placeId: string, dayIndex = 0, orderInDay = 0) {
  await db.insert(projectSelections)
    .values({ projectId, placeId, dayIndex, orderInDay })
    .onConflictDoUpdate({
      target: [projectSelections.projectId, projectSelections.placeId],
      set: { dayIndex, orderInDay },
    });
}

export async function unselectPlace(projectId: string, placeId: string) {
  await db.delete(projectSelections)
    .where(and(eq(projectSelections.projectId, projectId), eq(projectSelections.placeId, placeId)));
}