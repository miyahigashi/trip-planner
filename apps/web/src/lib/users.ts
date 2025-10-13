import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq, sql, or } from "drizzle-orm";

export async function findUserByIdentifier(identifier: string) {
  const q = identifier.trim();
  // 先にハンドル（小文字）を試す
  const byHandle = await db
    .select({ id: users.id, email: users.email, handle: users.handle })
    .from(users)
    .where(eq(sql`lower(${users.handle})`, q.toLowerCase()))
    .limit(1);

  if (byHandle.length) return byHandle[0];

  // 次にメール
  const byEmail = await db
    .select({ id: users.id, email: users.email, handle: users.handle })
    .from(users)
    .where(eq(sql`${users.email}`, q))
    .limit(1);

  return byEmail[0] ?? null;
}
