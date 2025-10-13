// apps/web/src/lib/gcs.ts
import { Storage } from "@google-cloud/storage";

if (!process.env.GCS_BUCKET) throw new Error("GCS_BUCKET is required");
if (!process.env.GCP_SERVICE_ACCOUNT) throw new Error("GCP_SERVICE_ACCOUNT is required");

export const GCS_BUCKET = process.env.GCS_BUCKET;
// サービスアカウントJSONを環境変数から復元
const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT);

export const storage = new Storage({
  credentials,
});

export const bucket = storage.bucket(GCS_BUCKET);

export function keyToPublicUrl(key?: string | null) {
  if (!key) return "";
  const bucket =
    process.env.NEXT_PUBLIC_GCS_BUCKET ?? process.env.GCS_BUCKET ?? "";
  return `https://storage.googleapis.com/${bucket}/${encodeURI(key)}`;
}
