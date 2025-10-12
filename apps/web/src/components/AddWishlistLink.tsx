"use client";

import { useState } from "react";
import Link from "next/link";

type PlaceInput = {
  placeId: string;
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  userRatingsTotal?: number | null;
  types?: string[] | null;
  photoRef?: string | null;
  prefecture?: string | null;
  imageSrcUrl?: string | null; // ある場合だけ
};

type Props = {
  /** place を渡すと「確認＋メモ入力→POST」モード。未指定なら従来通りリンク遷移 */
  place?: PlaceInput;
  /** アイコンだけ表示（ラベルは sr-only） */
  iconOnly?: boolean;
  /** ラベル。未指定なら "Wishlistsに追加" */
  label?: string;
  className?: string;
  /** 追加完了後のフック（一覧をリロードなど） */
  onAdded?: () => void;
};

function PlusIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M11 4h2v16h-2zM4 11h16v2H4z" fill="currentColor" />
    </svg>
  );
}

export default function AddWishlistLink({
  place,
  iconOnly = false,
  label = "Wishlistsに追加",
  className = "",
  onAdded,
}: Props) {
  const base =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold " +
    "text-white bg-gradient-to-r from-sky-500 to-teal-500 " +
    "shadow-[0_6px_20px_-6px_rgba(14,165,233,.6)] " +
    "hover:brightness-110 focus-visible:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-sky-500";

  // ---- Linkモード（place 未指定）----
  if (!place) {
    return (
      <Link
        href="/wishlists/new"
        className={`${base} ${className}`}
        aria-label={label}
      >
        <PlusIcon />
        {iconOnly ? <span className="sr-only">{label}</span> : <span>{label}</span>}
      </Link>
    );
  }

  // ---- 確認＋メモ入力モード（place 指定）----
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  const submit = async () => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/wishlists", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place: {
            placeId: place.placeId,
            name: place.name,
            address: place.address ?? null,
            lat: place.lat ?? null,
            lng: place.lng ?? null,
            rating: place.rating ?? null,
            userRatingsTotal: place.userRatingsTotal ?? null,
            types: place.types ?? null,
            photoRef: place.photoRef ?? null,
            prefecture: place.prefecture ?? null,
          },
          imageSrcUrl: place.imageSrcUrl ?? null,
          note: note || null, // ★ メモを送信
        }),
      });

      if (!res.ok && res.status !== 409) {
        // 409 は既存 → API 側で note を上書き保存する実装なら OK
        throw new Error(`Add failed: ${res.status}`);
      }

      closeModal();
      onAdded?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`${base} ${className}`}
        aria-label={label}
      >
        <PlusIcon />
        {iconOnly ? <span className="sr-only">{label}</span> : <span>{label}</span>}
      </button>

      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[70]">
          {/* 背景 */}
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          {/* 本体 */}
          <div className="absolute inset-x-0 top-1/2 mx-auto w-[92%] max-w-md -translate-y-1/2 rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold mb-1">この場所を追加しますか？</h3>
            <p className="text-sm text-gray-600 mb-3">{place.name}</p>

            <label className="block space-y-1">
              <span className="text-sm text-gray-600">メモ（任意）</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={200}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="例）家族旅行で行きたい、夜に行く…など"
              />
              <div className="text-right text-xs text-gray-500">{note.length}/200</div>
            </label>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                onClick={closeModal}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {submitting ? "追加中…" : "追加する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
