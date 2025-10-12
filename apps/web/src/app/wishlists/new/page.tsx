// apps/web/src/app/wishlists/new/page.tsx
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import PlacesSearch, { FoundPlace } from "@/components/PlacesSearch";
import Image from "next/image";

const photoUrl = (ref?: string | null) =>
  ref
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : "/placeholder.jpg";

// ★ビジュアル用の星コンポーネント（簡易）
function Stars({ value = 0 }: { value?: number | null }) {
  const v = Math.max(0, Math.min(5, value ?? 0));
  return (
    <div className="inline-flex items-center gap-1 align-middle">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${i < Math.floor(v) ? "text-amber-500" : "text-gray-300"}`}
          aria-hidden
        >
          <path
            fill="currentColor"
            d="m12 17.27 6.18 3.73-1.64-7.03L21.5 9.24l-7.19-.61L12 2 9.69 8.63 2.5 9.24l4.96 4.73L5.82 21z"
          />
        </svg>
      ))}
      <span className="text-sm text-gray-700">{v.toFixed(1)}</span>
    </div>
  );
}

export default function NewWishlistPage() {
  const router = useRouter();

  // 確認モーダル用
  const [pending, setPending] = useState<FoundPlace | null>(null);
  const [isOpen, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 候補を選択 → モーダルを開く
  const handleSelect = useCallback((p: FoundPlace) => {
    setMessage(null);
    setPending(p);
    setNote("");
    setOpen(true);
  }, []);

  // 追加確定 → POST
  const handleConfirmAdd = useCallback(async () => {
    if (!pending || submitting) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const resp = await fetch("/api/wishlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place: {
            placeId: pending.placeId,
            name: pending.name,
            address: pending.address,
            lat: pending.lat,
            lng: pending.lng,
            rating: pending.rating,
            userRatingsTotal: pending.userRatingsTotal,
            types: pending.types,
            prefecture: pending.prefecture,
            note, // ★ メモ送信
          },
          imageSrcUrl: pending.imageSrcUrl ?? null, // ★ 画像はサーバで保存
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error ?? `Failed: ${resp.status}`);
      }

      // 成功 → 閉じて一覧へ
      setOpen(false);
      setPending(null);
      router.push("/wishlists");
      router.refresh();
    } catch (e: any) {
      setMessage(e?.message ?? "追加に失敗しました。もう一度お試しください。");
      setSubmitting(false);
    }
  }, [pending, note, router, submitting]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Wishlists に追加</h1>

      <div className="rounded-lg border bg-white p-4">
        <p className="mb-3 text-sm text-gray-600">
          追加したい場所名を入力し、候補から選択してください。
        </p>

        <PlacesSearch
          onSelect={handleSelect}
          onClear={() => {
            setMessage(null);
            setSubmitting(false);
          }}
          placeholder="例: 東京タワー / teamLab Planets / SUSHI○○"
          className="w-full rounded-md border px-3 py-2"
        />

        {submitting && <p className="mt-3 text-sm text-gray-500">登録中です…</p>}
        {message && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {message}
          </p>
        )}
      </div>

      {/* 確認 + メモ入力モーダル */}
      {isOpen && pending && (
        // ★ 親を fixed+flex にしてここで中央寄せ
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            // ノッチ・ホームバー対策
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
            // iOS Safari のアドレスバーで高さが縮まる問題対策
            minHeight: "100dvh",
          }}
        >
          {/* 背景 */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !submitting && setOpen(false)}
          />

          {/* 本体。relative にして上の absolute 背景と重ならないようにする */}
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl max-h-[85dvh] overflow-y-auto">
            <div className="p-5">
              {/* 画像（任意） */}
              {(pending.imageSrcUrl || pending.photoRef) && (
                <img
                  src={pending.imageSrcUrl ?? photoUrl(pending.photoRef)}
                  alt={pending.name}
                  className="mb-3 h-40 w-full rounded-lg object-cover"
                />
              )}

              {/* レーティング（任意） */}
              {(pending.rating != null || pending.userRatingsTotal != null) && (
                <div className="mb-2 flex items-center gap-2 text-[15px]">
                  <span>⭐</span>
                  {pending.rating != null && <span>{pending.rating}</span>}
                  {pending.userRatingsTotal != null && (
                    <span className="text-gray-600">
                      （{pending.userRatingsTotal.toLocaleString()}件）
                    </span>
                  )}
                </div>
              )}

              <h3 className="text-base font-semibold">
                この場所をWishlistsに追加しますか？
              </h3>
              <div className="mt-2 text-sm text-gray-700">
                <div className="font-medium">{pending.name}</div>
                {pending.address && <div className="text-gray-600">{pending.address}</div>}
              </div>

              <label className="mt-4 block space-y-1">
                <span className="text-sm text-gray-600">メモ（任意）</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="例）この季節に行きたい / 予約が必要 など"
                />
              </label>

              <div
                className="sticky bottom-0 -m-5 mt-4 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70"
              >
                <div
                  className="flex justify-end gap-2 p-4"
                  // iPhone のホームバーぶんの余白を必ず確保
                  style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
                >
                  <button
                    className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                    onClick={() => setOpen(false)}
                    disabled={submitting}
                  >
                    キャンセル
                  </button>
                  <button
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 disabled:opacity-50"
                    onClick={handleConfirmAdd}
                    disabled={submitting}
                  >
                    {submitting ? "追加中…" : "この内容で追加"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
