// apps/web/src/app/settings/profile/updateProfile.action.ts
"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { users, userProfiles } from "@/db/schema"; // ← 追加
import { and, eq, ne, sql } from "drizzle-orm";

const Handle = z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/);

const Body = z.object({
  clerkUserId: z.string().min(1),
  handle: z.string().optional().nullable(),
  displayName: z.string().trim().max(50).optional().nullable(), // ← 追加
  bio: z.string().max(500).optional().nullable(),
  avatarKey: z.string().max(300).optional().nullable(),
});

export async function updateProfile(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData.entries());

  const parsed = Body.parse({
    clerkUserId: String(raw.clerkUserId || ""),
    handle: raw.handle ? String(raw.handle) : null,
    displayName: raw.displayName ? String(raw.displayName) : null, // ← 追加
    bio: raw.bio ? String(raw.bio) : null,
    avatarKey: raw.avatarKey ? String(raw.avatarKey) : null,
  });

  // 自分のユーザーID取得
  const me = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, parsed.clerkUserId))
    .limit(1);

  if (!me.length) throw new Error("user not found");
  const userId = me[0].id;

  // handle 正規化 & 重複チェック（小文字比較）
  let handleNorm: string | null = null;
  if (parsed.handle && parsed.handle.trim() !== "") {
    handleNorm = Handle.parse(parsed.handle);
    const dupe = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(sql`lower(${users.handle})`, handleNorm), ne(users.id, userId)))
      .limit(1);
    if (dupe.length) throw new Error("このアカウントIDは既に使われています");
  }

  // users 更新
  await db
    .update(users)
    .set({
      handle: handleNorm,
      bio: parsed.bio ?? null,
      avatarKey: parsed.avatarKey ?? null,
    })
    .where(eq(users.id, userId));

  // userProfiles を upsert（displayName）
  await db
    .insert(userProfiles)
    .values({
      userId,
      displayName: parsed.displayName && parsed.displayName.trim() !== "" ? parsed.displayName : null,
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        displayName:
          parsed.displayName && parsed.displayName.trim() !== "" ? parsed.displayName : null,
      },
    });

  // 再検証（プロフィール/友だち/メンバー選択など名称が出る場所）
  revalidatePath("/profile");
  revalidatePath("/friends");
  revalidatePath("/projects"); // 一覧系をまとめて。個別に必要なら適宜追加。
  if (handleNorm) revalidatePath(`/u/${handleNorm}`);

  redirect("/profile");
}
