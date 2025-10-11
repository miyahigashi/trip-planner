// src/app/api/images/fetch-and-save/route.ts
import "server-only";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

// ---- sharp は動的 import（VS Code の型解決ズレ対策 & Edge回避）----
type SharpModule = typeof import("sharp");
let _sharp: SharpModule | null = null;
async function getSharp() {
  if (_sharp) return _sharp;
  _sharp = (await import("sharp")).default as unknown as SharpModule;
  return _sharp;
}

// ---- GCS は動的 import（ビルド安定化）----
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

const allowHosts = new Set(["images.unsplash.com", "picsum.photos", "maps.googleapis.com"]);

// ====== 設定（好みで調整） ======
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const FETCH_TIMEOUT_MS = 12_000;
const WEBP_QUALITY = 82;
const VARIANTS = [
  { name: "w800", width: 800 },
  { name: "w400", width: 400 },
] as const;
// ===========================

// 公開URLを返したい場合（バケットが“公開オブジェクト読み取り可”の場合）
function publicUrl(bucketName: string, key: string) {
  return `https://storage.googleapis.com/${bucketName}/${encodeURI(key)}`;
}

// 署名URLを返したい場合
async function signedUrl(key: string) {
  const bucket = await getBucket();
  const [url] = await bucket.file(key).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 10 * 60 * 1000, // 10 min
  });
  return url;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const srcUrl = (body as { srcUrl?: string })?.srcUrl ?? "";
    if (!srcUrl) {
      return NextResponse.json({ error: "srcUrl required" }, { status: 400 });
    }

    // 1) ホスト検証
    const u = new URL(srcUrl);
    if (!allowHosts.has(u.hostname)) {
      return NextResponse.json({ error: "host not allowed" }, { status: 400 });
    }

    // 2) タイムアウト＆最初にHEADで軽く確認（サイズ/タイプ）
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const head = await fetch(srcUrl, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(t);

    // 許容サイズチェック
    const len = Number(head?.headers.get("content-length") ?? "0");
    if (len && len > MAX_BYTES) {
      return NextResponse.json({ error: "image too large" }, { status: 413 });
    }

    // コンテントタイプチェック（image/* 限定）
    const headType = head?.headers.get("content-type") ?? "";
    if (head && head.ok && headType && !headType.startsWith("image/")) {
      return NextResponse.json({ error: "content-type not allowed" }, { status: 415 });
    }

    // 3) 本体取得（再度タイムアウト付き）
    const controller2 = new AbortController();
    const t2 = setTimeout(() => controller2.abort(), FETCH_TIMEOUT_MS);
    const resp = await fetch(srcUrl, { cache: "no-store", signal: controller2.signal });
    clearTimeout(t2);

    if (!resp.ok) {
      return NextResponse.json({ error: `fetch failed: ${resp.status}` }, { status: 502 });
    }

    const contentType = resp.headers.get("content-type") ?? "application/octet-stream";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "content-type not allowed" }, { status: 415 });
    }

    const ab = await resp.arrayBuffer();

    // 限界超過を防止（HEADレスポンスが無い場合の二重安全策）
    if (ab.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "image too large" }, { status: 413 });
    }

    // 4) ハッシュ化（オリジナルバイナリ）
    const origBuf = Buffer.from(ab);
    const hash = createHash("sha256").update(origBuf).digest("hex").slice(0, 16);
    const base = `images/${hash}`;

    // 5) メタ/回転正規化（EXIF補正）
    const sharp = await getSharp();
    const img = sharp(origBuf).rotate(); // EXIF Orientation を考慮
    const meta = await img.metadata();
    const origExt = (meta.format ?? "jpg").toLowerCase();

    // 6) すでに存在するか（重複排除）
    const bucket = await getBucket();
    const origKey = `${base}/original.${origExt}`;
    const [exists] = await bucket.file(origKey).exists();
    if (!exists) {
      await bucket.file(origKey).save(origBuf, {
        resumable: false,
        contentType,
        metadata: { cacheControl: "public, max-age=31536000, immutable" },
      });
    }

    // 7) WebP バリアント生成
    const variantBuffers = await Promise.all(
      VARIANTS.map(({ width }) =>
        img.clone().resize({ width }).webp({ quality: WEBP_QUALITY }).toBuffer()
      )
    );

    // 8) 並列保存（存在チェックしてスキップ）
    await Promise.all(
      VARIANTS.map(async ({ name }, i) => {
        const key = `${base}/${name}.webp`;
        const f = bucket.file(key);
        const [vExists] = await f.exists();
        if (!vExists) {
          await f.save(variantBuffers[i], {
            resumable: false,
            contentType: "image/webp",
            metadata: { cacheControl: "public, max-age=31536000, immutable" },
          });
        }
      })
    );

    // 9) URL を返す（どちらか選択）
    const bucketName = bucket.name;
    const variants = [
      { key: origKey, type: "orig" as const },
      ...VARIANTS.map(({ name }) => ({ key: `${base}/${name}.webp`, type: "webp" as const })),
    ];

    const returnSigned = false; // 署名URLが必要なら true
    const urls = await Promise.all(
      variants.map(async (v) => ({
        ...v,
        url: returnSigned ? await signedUrl(v.key) : publicUrl(bucketName, v.key),
      }))
    );

    return NextResponse.json({
      ok: true,
      hash,
      meta: { width: meta.width, height: meta.height, format: meta.format },
      variants: urls, // [{ key, type, url }]
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
