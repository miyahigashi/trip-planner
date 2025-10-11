// apps/web/src/lib/images.ts
import "server-only";
import sharp from "sharp";
import { createHash } from "node:crypto";

// ---- GCS Bucket (lazy init) ----
let _bucket: any = null;
async function getBucket() {
  if (_bucket) return _bucket;
  const { Storage } = await import("@google-cloud/storage");
  const c = JSON.parse(process.env.GCP_SERVICE_ACCOUNT!);
  const storage = new Storage({ credentials: c, projectId: c.project_id });
  _bucket = storage.bucket(process.env.GCS_BUCKET!);
  return _bucket;
}

// 取得元ホストの許可リスト（必要に応じて追加）
const ALLOW_HOSTS = new Set([
  "images.unsplash.com",
  "picsum.photos",
  "maps.googleapis.com",
]);

export type SavedImage = {
  hash: string;
  w800Key: string; // ← 一覧やカードでこれを使う
  w400Key: string; // ← スマホなど軽量用
};

/**
 * 外部画像URLを取得して、w800 / w400 の WebP を作成して GCS に保存する。
 * - オリジナルは保存しない（2サイズのみ）
 * - 既に存在する場合は上書きしない（idempotent）
 */
export async function saveImageFromUrl(srcUrl: string): Promise<SavedImage> {
  const u = new URL(srcUrl);
  if (!ALLOW_HOSTS.has(u.hostname)) throw new Error("host not allowed");

  // 取得（no-store で都度取りに行く）
  const resp = await fetch(srcUrl, { cache: "no-store" });
  if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`);

  const origBuf = Buffer.from(await resp.arrayBuffer());

  // ハッシュは元バイナリから算出（重複排除用）
  const hash = createHash("sha256").update(origBuf).digest("hex").slice(0, 16);
  const base = `images/${hash}`;
  const w800Key = `${base}/w800.webp`;
  const w400Key = `${base}/w400.webp`;

  // 変換（EXIFの回転にも対応）
  const img = sharp(origBuf).rotate();
  const webp800 = await img.clone().resize({ width: 800 }).webp({ quality: 82 }).toBuffer();
  const webp400 = await img.clone().resize({ width: 400 }).webp({ quality: 82 }).toBuffer();

  const bucket = await getBucket();

  // 既存ならスキップ（idempotent）
  const w800 = bucket.file(w800Key);
  const w400 = bucket.file(w400Key);
  const [e800] = await w800.exists();
  const [e400] = await w400.exists();

  if (!e800) {
    await w800.save(webp800, {
      resumable: false,
      contentType: "image/webp",
      metadata: { cacheControl: "public, max-age=31536000, immutable" },
    });
  }
  if (!e400) {
    await w400.save(webp400, {
      resumable: false,
      contentType: "image/webp",
      metadata: { cacheControl: "public, max-age=31536000, immutable" },
    });
  }

  return { hash, w800Key, w400Key };
}

/** GCS 公開URL（バケットが public read の場合に利用） */
export function keyToPublicUrl(key: string) {
  return `https://storage.googleapis.com/${process.env.GCS_BUCKET!}/${encodeURI(key)}`;
}
