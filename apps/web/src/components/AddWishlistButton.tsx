"use client";

import { useEffect, useState } from "react";
import Portal from "./Portal";

type PlacePayload = {
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

type Props = {
  /** 追加したい Place 情報（既存のPOSTと同じ形でOK） */
  place: PlacePayload;
  /** 画像URLをサーバ保存させたい時だけ渡す（省略可） */
  imageSrcUrl?: string | null;
  /** 追加後にUI更新したい時のフック（省略可） */
  onAdded?: () => void;
  /** ボタンの見た目を調整したい時 */
  className?: string;
  /** ラベル（デフォルト: Wishlistsに追加） */
  label?: string;
};

export default function AddWishlistButton({
  place,
  imageSrcUrl,
  onAdded,
  className = "",
  label = "Wishlistsに追加",
}: Props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // モーダル表示中は背面スクロール抑止
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handleSubmit = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/wishlists", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place: { ...place, note: note || null }, // ← いまのAPI形に合わせて place.note で送る
          imageSrcUrl: imageSrcUrl ?? null,
        }),
      });
      if (!res.ok && res.status !== 409) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed: ${res.status}`);
      }
      setOpen(false);
      setNote("");
      onAdded?.();
    } catch (e: any) {
      setErr(e.message || "追加に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold " +
          "text-white bg-gradient-to-r from-sky-500 to-teal-500 " +
          "shadow-[0_6px_20px_-6px_rgba(14,165,233,.6)] hover:brightness-110 " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 " +
          className
        }
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path d="M11 4h2v16h-2zM4 11h16v2H4z" fill="currentColor" />
        </svg>
        <span>{label}</span>
      </button>

      {open && (
        <Portal>
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-[70]">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => !loading && setOpen(false)}
            />
            <div
              className="absolute inset-x-0 top-1/2 mx-auto w-[92%] max-w-md -translate-y-1/2
                         rounded-2xl bg-white p-5 shadow-xl"
            >
              <h3 className="text-base font-semibold">ウィッシュリストに追加</h3>
              <p className="mt-1 text-sm text-gray-600">
                「{place.name}」にメモを付けて保存できます（任意）。
              </p>

              <label className="mt-3 block text-sm text-gray-600">メモ（任意）</label>
              <textarea
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                rows={4}
                placeholder="例：次の旅行で行きたい／18時以降が空いてる等"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={loading}
              />

              {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  キャンセル
                </button>
                <button
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "追加中…" : "追加する"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
