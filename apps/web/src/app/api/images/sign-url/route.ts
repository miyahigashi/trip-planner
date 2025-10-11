// apps/web/src/app/api/images/sign-url/route.ts
import "server-only";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

type GcsBucket = import("@google-cloud/storage").Bucket;
let _bucket: GcsBucket | null = null;

async function getBucket() {
  if (_bucket) return _bucket;
  const { Storage } = await import("@google-cloud/storage");
  const c = JSON.parse(process.env.GCP_SERVICE_ACCOUNT!);
  const storage = new Storage({ credentials: c, projectId: c.project_id });
  _bucket = storage.bucket(process.env.GCS_BUCKET!);
  return _bucket;
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key"); // 例: images/test.jpg
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

  const bucket = await getBucket();
  const [url] = await bucket.file(key).getSignedUrl({
    version: "v4", action: "read", expires: Date.now() + 10 * 60 * 1000,
  });
  return NextResponse.json({ url });
}
