// apps/web/src/lib/user.ts（最終版）
import { currentUser } from "@clerk/nextjs/server";
import { db, eq } from "@/db";
import { users } from "@/db/schema";

export async function ensureDbUser() {
  const cu = await currentUser();
  if (!cu) throw new Error("UNAUTHENTICATED");

  const clerkId = cu.id; // "user_xxx"
  const email = cu.emailAddresses?.[0]?.emailAddress ?? "unknown@example.com";

  // 1) clerkUserId で検索
  const byClerk = await db.select().from(users).where(eq(users.clerkUserId, clerkId)).limit(1);
  if (byClerk.length) return byClerk[0];

  // 2) email で既存行があれば clerkUserId を埋めて返す
  const byEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (byEmail.length) {
    await db.update(users).set({ clerkUserId: clerkId }).where(eq(users.id, byEmail[0].id));
    return { ...byEmail[0], clerkUserId: clerkId };
  }

  // 3) なければ作成（← clerkUserId を必ず含める）
  const inserted = await db
    .insert(users)
    .values({ clerkUserId: clerkId, email })
    .onConflictDoNothing()
    .returning();

  if (inserted.length) return inserted[0];

  // 同時実行の最後の保険
  const [row] = await db.select().from(users).where(eq(users.clerkUserId, clerkId)).limit(1);
  return row;
}
