// apps/web/src/app/wishlists/new/page.tsx
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import PlacesSearch, { FoundPlace } from "@/components/PlacesSearch";

export default function NewWishlistPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSelect = useCallback(
    async (p: FoundPlace) => {
      if (submitting) return;
      setSubmitting(true);
      setMessage(null);

      try {
        // 画像は事前保存せず、「元の画像URL」をAPIに渡す
        // サーバ側（/api/wishlists POST）で saveImageFromUrl → places.image_url を更新する
        const resp = await fetch("/api/wishlists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            place: {
              placeId: p.placeId,
              name: p.name,
              address: p.address,
              lat: p.lat,
              lng: p.lng,
              rating: p.rating,
              userRatingsTotal: p.userRatingsTotal,
              types: p.types,
              prefecture: p.prefecture,
              // imageUrl は送らない（DB 更新はサーバで実施）
            },
            imageSrcUrl: p.imageSrcUrl ?? null, // ★これだけ渡す
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err?.error ?? `Failed: ${resp.status}`);
        }

        // 登録後に一覧へ
        router.push("/wishlists");
        router.refresh();
      } catch (e: any) {
        setMessage(e?.message ?? "追加に失敗しました。もう一度お試しください。");
        setSubmitting(false);
      }
    },
    [router, submitting]
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Wishlists に追加</h1>

      <div className="rounded-lg border bg-white p-4">
        <p className="mb-3 text-sm text-gray-600">
          追加したい場所名を入力し、候補から選択してください。
        </p>

        <PlacesSearch
          onSelect={handleSelect}
          onClear={() => { setMessage(null); setSubmitting(false); }}
          placeholder="例: 東京タワー / teamLab Planets / SUSHI○○"
          className="w-full rounded-md border px-3 py-2"
        />

        {submitting && (
          <p className="mt-3 text-sm text-gray-500">登録中です…</p>
        )}
        {message && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
