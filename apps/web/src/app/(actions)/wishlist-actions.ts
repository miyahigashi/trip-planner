// apps/web/src/app/(actions)/wishlist-actions.ts
'use server';

import { db } from "../../db/client";
import { wishlists } from "../../db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function addToWishlist(input: { placeId: string }) {
  const session = await auth();
  const userId = session?.userId;
  if (!userId) throw new Error("Unauthenticated");

  await db.insert(wishlists).values({
    userId,         // DB が uuid 型なら適切にセット
    placeId: input.placeId,
    createdAt: new Date(),
  });

  // ホームと一覧を再検証
  revalidatePath("/");          // ← ホーム
  revalidatePath("/wishlists"); // ← ウィッシュリスト
}
