"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";

const Handle = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/);

const Body = z.object({
  clerkUserId: z.string().min(1),
  handle: z.string().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatarKey: z.string().max(300).optional().nullable(),
});

export async function updateProfile(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = Body.parse({
    clerkUserId: String(raw.clerkUserId || ""),
    handle: raw.handle ? String(raw.handle) : null,
    bio: raw.bio ? String(raw.bio) : null,
    avatarKey: raw.avatarKey ? String(raw.avatarKey) : null,
  });
  

  const me = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, parsed.clerkUserId))
    .limit(1);

  if (!me.length) throw new Error("user not found");

  let handleNorm: string | null = null;
  if (parsed.handle && parsed.handle.trim() !== "") {
    handleNorm = Handle.parse(parsed.handle); // バリデーション
    // 既に他ユーザーが使っていないか（小文字で比較）
    const dupe = await db
      .select({ id: users.id })
      .from(users)
      .where(and(
        eq(sql`lower(${users.handle})`, handleNorm),
        ne(users.id, me[0].id)
      ))
      .limit(1);
    if (dupe.length) {
      throw new Error("このアカウントIDは既に使われています");
    }
  }

  await db
    .update(users)
    .set({
      handle: handleNorm,
      bio: parsed.bio ?? null,
      avatarKey: parsed.avatarKey ?? null,
    })
    .where(eq(users.id, me[0].id));

    // プロフィールの閲覧ページを最新化
  revalidatePath("/profile");
  if (parsed.handle) revalidatePath(`/u/${parsed.handle}`);

  // ← ここで閲覧ページに遷移
  redirect("/profile");
//   return { ok: true };
}
