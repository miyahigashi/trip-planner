// apps/web/src/app/api/wishlists/route.ts

import { NextResponse } from "next/server";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import { ensureDbUser } from "@/lib/user";
import { places, wishlists } from "@/db/schema";
// import { saveImageFromUrl } from "@/lib/images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";  // ← 追加
export const revalidate = 0;             // ← 追加

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  // 同一オリジンなら最低限 204 返せば十分。外部ドメインから叩くなら CORS ヘッダも付与
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  // 外部から叩く想定があるときだけ許可（同一オリジンのみなら不要）
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  // Cookie を使う場合は以下を付ける（Allow-Origin に * は使えない点に注意）
  headers["Access-Control-Allow-Credentials"] = "true";

  return new Response(null, { status: 204, headers });
}

// 取得
export async function GET(req: Request) {
  // return NextResponse.json({ ping: "ok" });
  try {
    const user = await ensureDbUser();
    const { searchParams } = new URL(req.url);
    const order = searchParams.get("order") ?? "createdAt"; // "createdAt" | "name"

    const rows = await db
      .select({
        id: places.id,                 // places 側の UUID（表示用など）
        placeId: places.placeId,       // ← フロントの DELETE で使用
        name: places.name,
        address: places.address,
        lat: places.lat,
        lng: places.lng,
        rating: places.rating,
        userRatingsTotal: places.userRatingsTotal,
        types: places.types,
        photoRef: places.photoRef,
        imageKey: places.imageUrl,
        prefecture: places.prefecture,
      })
      .from(wishlists)
      .innerJoin(places, eq(wishlists.placeId, places.placeId))
      .where(eq(wishlists.userId, user.id))
      .orderBy(order === "name" ? asc(places.name) : desc(wishlists.createdAt));

    return NextResponse.json({ items: rows });
  } catch (e) {
    console.error("[GET /api/wishlists] ERROR:", e);
    const msg = String(e);
    const code = msg.includes("UNAUTHENTICATED") ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}

// 追加（place upsert + wishlist upsert）
export async function POST(req: Request) {
  try {
    const user = await ensureDbUser();

    // 期待ペイロード:
    // { place: { placeId, name, ... , imageKey? }, imageSrcUrl? }
    const { saveImageFromUrl } = await import("@/lib/images");
    const body = (await req.json()) as {
      place: {
        placeId: string;
        name: string;
        address?: string | null;
        lat?: number | null;
        lng?: number | null;
        rating?: number | null;
        userRatingsTotal?: number | null;
        types?: string[] | null;
        photoRef?: string | null;
        imageKey?: string | null;
        prefecture?: string | null;
      };
      imageSrcUrl?: string | null;     // ★ 元画像URL（Placesの写真URLなど）
    };

    const p = body.place;
    if (!p?.placeId || !p?.name) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 1) places upsert（存在しなければ作成／存在すれば何もしない）
    await db
      .insert(places)
      .values({
        placeId: p.placeId,
        name: p.name,
        address: p.address ?? null,
        lat: p.lat ?? null,
        lng: p.lng ?? null,
        rating: p.rating ?? null,
        userRatingsTotal: p.userRatingsTotal ?? null,
        types: p.types ?? [],
        photoRef: p.photoRef ?? null,
        prefecture: p.prefecture ?? null,
      })
      .onConflictDoNothing();

    // 2) wishlists を upsert（重複なら 409）
    const inserted = await db
      .insert(wishlists)
      .values({ userId: user.id, placeId: p.placeId })
      .onConflictDoNothing()
      .returning({ placeId: wishlists.placeId });

    if (inserted.length === 0) {
      // 既にこの userId/placeId の wishlist が存在
      return NextResponse.json({ ok: false, error: "Already すでにウィッシュリストに登録されています" }, { status: 409 });
    }

    // 3) 画像 key の確定
    //    - 優先: place.imageKey（クライアントで既に fetch-and-save 済み）
    //    - 次点: imageSrcUrl があればサーバーで保存して key を生成
    let finalKey: string | null = p.imageKey ?? null;

    if (!finalKey && body.imageSrcUrl) {
      console.log("[wishlists:POST] saveImageFromUrl src =", body.imageSrcUrl);
      // 既存に key が未設定のときだけ保存してセット
      const [row] = await db
        .select({ imageUrl: places.imageUrl })
        .from(places)
        .where(eq(places.placeId, p.placeId))
        .limit(1);

      if (!row?.imageUrl) {
        try {
          const saved = await saveImageFromUrl(body.imageSrcUrl);
          finalKey = saved.w800Key; // 一覧表示用には w800 を採用
          console.log("[wishlists:POST] saved image key =", finalKey);
        } catch (e) {
          console.warn("[POST /api/wishlists] saveImageFromUrl failed:", e);
        }
      }
    }

    if (finalKey) {
      await db
        .update(places)
        .set({ imageUrl: finalKey })
        .where(eq(places.placeId, p.placeId));
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = String(e ?? "");
    const isAuthErr = /UNAUTHENTICATED|Unauthorized|Unauthenticated|No\s*session|No\s*current\s*user/i.test(msg);
    const code = isAuthErr ? 401 : 500;
    console.error("[/api/wishlists] ERROR:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}
