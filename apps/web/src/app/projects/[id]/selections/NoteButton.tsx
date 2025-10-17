// apps/web/src/app/projects/[id]/selections/NoteButton.tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type Props = {
  projectId: string;
  placeId: string;
  initialNote: string | null;
  className?: string;        // トリガーボタンの見た目
  onSaved?: (note: string | null) => void; // 保存後に親へ反映
};

export default function NoteButton({
  projectId,
  placeId,
  initialNote,
  className,
  onSaved,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState(initialNote ?? "");
  const [pending, startTransition] = React.useTransition();

  // 開いている間は背面スクロールをロック
  React.useEffect(() => {
    if (!open) return;
    const el = document.documentElement; // もしくは document.body
    const prev = el.style.overflow;
    el.style.overflow = "hidden";
    return () => {
      el.style.overflow = prev;
    };
  }, [open]);

  const save = () =>
    startTransition(async () => {
      const res = await fetch(`/api/projects/${projectId}/selections/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId,
          note: note.trim() === "" ? null : note.trim(),
        }),
      });
      if (!res.ok) {
        alert("保存に失敗しました");
        return;
      }
      onSaved?.(note.trim() === "" ? null : note.trim());
      setOpen(false);
    });

  return (
    <>
      {/* トリガーボタン（カード内の好きな場所に置く） */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm",
          "bg-white/90 backdrop-blur shadow hover:bg-white",
          className,
        ].join(" ")}
      >
        <span aria-hidden>📝</span> メモ
      </button>

      {/* モーダル（常に画面中央） */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100]">
            {/* 背景 */}
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            {/* 中央配置ラッパー */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
              {/* ダイアログ本体 */}
              <div
                role="dialog"
                aria-modal="true"
                className="pointer-events-auto w-full max-w-md rounded-2xl bg-white p-4 shadow-xl"
                style={{
                  // iOS セーフエリア配慮（お好みで）
                  paddingBottom:
                    "calc(1rem + env(safe-area-inset-bottom, 0px))",
                  paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
                }}
              >
                <h3 className="text-base font-semibold">メモ</h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ここにメモを書けます"
                  className="mt-3 h-40 w-full resize-none rounded-lg border p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="h-10 rounded-lg border px-4 text-sm hover:bg-gray-50"
                    disabled={pending}
                  >
                    閉じる
                  </button>
                  <button
                    onClick={save}
                    className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                    disabled={pending}
                  >
                    {pending ? "保存中…" : "保存"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
