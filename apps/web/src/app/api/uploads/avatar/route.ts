import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { bucket } from "@/lib/gcs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const contentType = typeof body?.contentType === "string" ? body.contentType : "image/jpeg";
  const ext = contentType.split("/")[1] || "jpg";

  // 例: avatars/user_xxx/uuid.jpg
  const objectKey = `images/avatars/${userId}/${crypto.randomUUID()}.${ext}`;
  const file = bucket.file(objectKey);

  // v4 署名URL（PUT）
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 1000 * 60 * 5, // 5分
    contentType,
  });

  return NextResponse.json({ uploadUrl: url, objectKey });
}
