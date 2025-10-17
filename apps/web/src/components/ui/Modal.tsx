"use client";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** フッター（保存/閉じるなど）を渡したい場合に */
  footer?: React.ReactNode;
};

export default function Modal({ open, onClose, title, children, footer }: Props) {
  // 背景スクロールを止める
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  // Esc で閉じる
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      aria-hidden={false}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // オーバーレイクリックで閉じる
      }}
    >
      {/* 中央寄せ。dvh でモバイルのアドレスバー高さ変動に追従 */}
      <div className="flex min-h-[100dvh] items-center justify-center p-4 overscroll-contain">
        {/* パネル。高さは画面高-余白で制限し、内部をスクロール */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title || "ダイアログ"}
          className="w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/5
                     max-h-[calc(100dvh-2rem)] overflow-y-auto"
        >
          {/* ヘッダー（スクロール時に見えると便利なら sticky） */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3
                          border-b bg-white/95 px-4 py-3 backdrop-blur">
            <h2 className="text-base font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg
                         text-slate-500 hover:bg-slate-100"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>

          {/* 本文 */}
          <div className="px-4 py-3">{children}</div>

          {/* フッター（下部固定） */}
          {footer && (
            <div className="sticky bottom-0 z-10 border-t bg-white/95 px-4 py-3 backdrop-blur
                            pb-[calc(env(safe-area-inset-bottom))]">
              <div className="flex justify-end gap-2">{footer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
