// apps/web/src/libs/getOrCreateAppUserId.ts
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { clerkClient as _clerkClient } from "@clerk/nextjs/server";

export async function getOrCreateAppUserId(clerkUserId: string): Promise<string> {
  // 既存を先に検索
  const existing = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    columns: { id: true },
  });
  if (existing) return existing.id;

  // 取れればメール、取れなければフォールバック
  let email: string | null = null;
  try {
    const client: any =
      typeof _clerkClient === "function" ? await (_clerkClient as any)() : _clerkClient;
    const u = await client.users.getUser(clerkUserId);
    email = u?.primaryEmailAddress?.emailAddress ?? null;
  } catch {}

  // clerk_user_id に対して UPSERT（既存なら既存の id を返す）
  const inserted = await db
    .insert(users)
    .values({ clerkUserId, email: email ?? `${clerkUserId}@example.local` })
    .onConflictDoUpdate({
      target: users.clerkUserId,              // ★ clerk_user_id を一意キーに
      set: { clerkUserId: clerkUserId },      // no-op 更新で既存を返せるように
    })
    .returning({ id: users.id });

  return inserted[0].id; // ← 必ず同じ UUID を返す
}