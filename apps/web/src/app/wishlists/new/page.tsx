// apps/web/src/app/wishlists/new/page.tsx
"use client";

import { useCallback, useState, useEffect,useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PlacesSearch, { FoundPlace } from "@/components/PlacesSearch";

/* ========= helpers ========= */

const photoUrl = (src?: string | null) =>
  src ?? "/placeholder.jpg";

// 簡易の星表示
function Stars({
  value = 0,
  count,
}: {
  value?: number | null;
  count?: number | null;
}) {
  const v = Math.max(0, Math.min(5, value ?? 0));
  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className={`h-4 w-4 ${
              i < Math.floor(v) ? "text-amber-500" : "text-gray-300"
            }`}
            aria-hidden
          >
            <path
              fill="currentColor"
              d="m12 17.27 6.18 3.73-1.64-7.03L21.5 9.24l-7.19-.61L12 2 9.69 8.63 2.5 9.24l4.96 4.73L5.82 21z"
            />
          </svg>
        ))}
      </div>
      <span className="text-sm text-gray-700">{v.toFixed(1)}</span>
      {count != null && (
        <span className="text-sm text-gray-500">（{count.toLocaleString()}件）</span>
      )}
    </div>
  );
}

/** iOS Safari 含めて背景を完全固定 */
function lockBodyScroll() {
  const y = window.scrollY;
  document.body.dataset.scrollY = String(y);
  document.body.style.position = "fixed";
  document.body.style.top = `-${y}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}
function unlockBodyScroll() {
  const y = Number(document.body.dataset.scrollY || 0);
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  window.scrollTo(0, y);
  delete document.body.dataset.scrollY;
}

/* ========= page ========= */

export default function NewWishlistPage() {
  const router = useRouter();

  // 確認モーダル用
  const [pending, setPending] = useState<FoundPlace | null>(null);
  const [isOpen, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 候補選択 → モーダルを開く
  const handleSelect = useCallback((p: FoundPlace) => {
    // どの要素から開かれたか記録（必要ならボタンの onClick で set でもOK）
    triggerRef.current = document.activeElement as HTMLElement | null;
    setMessage(null);
    setPending(p);
    setNote("");
    setOpen(true);
    lockBodyScroll();
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setPending(null);
    setSubmitting(false);
    unlockBodyScroll();
    triggerRef.current?.focus?.();
  }, []);
  useEffect(() => {
    return () => {
      unlockBodyScroll();
      // 念のため、迷子のオーバーレイを片付ける（付けていれば）
      document.querySelectorAll('[data-modal-root]').forEach((n) => n.remove());
    };
  }, []);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!submitting) closeModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, submitting, closeModal]);
  useEffect(() => {
    if (!isOpen) return;
    // 次のフレームで
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [isOpen]);


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
          // 画像はサーバ側で保存（PlacesSearch が渡してくれる imageSrcUrl を使う）
          imageSrcUrl: pending.imageSrcUrl ?? null,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error ?? `Failed: ${resp.status}`);
      }

      closeModal();
      router.push("/wishlists");
      router.refresh();
    } catch (e: any) {
      setMessage(e?.message ?? "追加に失敗しました。もう一度お試しください。");
      setSubmitting(false);
    }
  }, [pending, note, router, submitting, closeModal]);
  useEffect(() => {
    // 中身のない overlay root が残っていたら除去
    document.querySelectorAll<HTMLElement>('.app-overlay-root').forEach(n => {
      if (!n.firstElementChild) n.remove();
    });
    // 念のため body 固定も解除
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
  }, []);
  

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
        // 外枠はポインターイベントを無効化（透明な全画面レイヤがクリックを奪わない）
        <div
          role="dialog"
          aria-modal="true"
          data-modal-root
          className="fixed inset-0 z-[70] app-overlay-root"
          style={{ height: '100dvh' }}
        >
          {/* 背景：クリックで閉じるので auto */}
          <button
            type="button"
            aria-label="モーダルを閉じる"
            className="absolute inset-0 bg-black/40 pointer-events-auto"
            onClick={() => !submitting && closeModal()}
          />

          {/* 中央寄せラッパ：ここから内側は操作可 */}
          <div
            className="
              absolute inset-0 flex justify-center p-4
              pt-[max(6dvh,calc(env(safe-area-inset-top)+12px))]
              pointer-events-auto
            "
            style={{ height: '100dvh' }}
          >
            <div
              className="
                w-[92%] max-w-md rounded-2xl bg-white shadow-xl
                flex max-h-[80dvh] flex-col overflow-hidden
              "
            >
              {/* スクロール領域 */}
              <div className="min-h-0 overflow-y-auto overscroll-contain p-5 pb-4">
                {pending?.imageSrcUrl && (
                  <img
                    src={pending.imageSrcUrl}
                    alt={pending.name}
                    className="mb-3 h-40 w-full rounded-lg object-cover"
                  />
                )}

                {(pending.rating != null || pending.userRatingsTotal != null) && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Stars value={pending.rating} />
                    {pending.userRatingsTotal != null && (
                      <span className="text-sm text-gray-500">
                        （{pending.userRatingsTotal.toLocaleString()}件）
                      </span>
                    )}
                  </div>
                )}

                <h2 className="text-lg font-semibold leading-snug">{pending.name}</h2>
                {pending.address && (
                  <p className="text-sm text-gray-600">{pending.address}</p>
                )}

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
              </div>

              {/* フッター（iOS セーフエリア考慮） */}
              <div
                className="border-t bg-white px-5 pt-3"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
              >
                <div className="flex justify-end gap-2">
                  <button
                    className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                    onClick={closeModal}
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
