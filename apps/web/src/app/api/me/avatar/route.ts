import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getInternalUserId(clerkUserId: string) {
  const row = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  return row[0]?.id ?? null;
}

export const runtime = "nodejs"; // sharpを使うならNode実行に

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await getInternalUserId(userId);
  if (!uid) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

  const { Storage } = await import("@google-cloud/storage");
  const { default: sharp } = await import("sharp");
  const c = JSON.parse(process.env.GCP_SERVICE_ACCOUNT!);
  const storage = new Storage({ credentials: c, projectId: c.project_id });
  const bucket = storage.bucket(process.env.GCS_BUCKET!);

  const buf = Buffer.from(await file.arrayBuffer());
  const base = `avatars/${uid}`;
  const key = `${base}/w400.webp`;

  const out = await sharp(buf).resize({ width: 400 }).webp({ quality: 82 }).toBuffer();
  await bucket.file(key).save(out, {
    resumable: false,
    contentType: "image/webp",
    metadata: { cacheControl: "public, max-age=31536000, immutable" },
  });

  // 保存（profileにも反映）
  await db
    .insert(userProfiles)
    .values({ userId: uid, avatarKey: key })
    .onConflictDoUpdate({ target: userProfiles.userId, set: { avatarKey: key } });

  return NextResponse.json({ avatarKey: key });
}
