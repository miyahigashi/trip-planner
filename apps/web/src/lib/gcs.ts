// apps/web/src/lib/gcs.ts
export function keyToPublicUrl(key?: string | null) {
  if (!key) return "";
  const bucket =
    process.env.NEXT_PUBLIC_GCS_BUCKET ?? process.env.GCS_BUCKET ?? "";
  return `https://storage.googleapis.com/${bucket}/${encodeURI(key)}`;
}
