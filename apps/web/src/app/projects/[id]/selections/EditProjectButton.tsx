// apps/web/src/app/projects/[id]/selections/EditProjectButton.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProjectMeta } from "@/app/(actions)/project-actions";

export default function EditProjectButton({
  projectId,
  initialTitle = "",
  initialDescription = "",
  initialStartDate = "",
  initialEndDate = "",
}: {
  projectId: string;
  initialTitle?: string;
  initialDescription?: string;
  initialStartDate?: string;
  initialEndDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  // 入力値（必要なら初期値を props で受け取ってセットしてOK）
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [emails, setEmails] = useState<string>(""); // カンマ区切り

  // 念のため、props変化時に同期
  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
  }, [initialStartDate, initialEndDate, initialTitle, initialDescription]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const inviteEmails = emails
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    start(async () => {
      await updateProjectMeta(projectId, { startDate, endDate, inviteEmails, title, description });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
        onClick={() => setOpen(true)}
      >
        ✏️ 編集
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => !pending && setOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">プロジェクトを編集</h3>
              <button type="button" className="text-slate-500 hover:text-slate-700" onClick={() => setOpen(false)} disabled={pending}>✕</button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {/* タイトル */}
              <label className="block text-sm">
                <span className="block text-slate-600 mb-1">タイトル</span>
                <input
                  type="text"
                  className="w-full rounded-lg border px-3 py-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="旅のタイトル"
                />
              </label>

              {/* 説明 */}
              <label className="block text-sm">
                <span className="block text-slate-600 mb-1">説明</span>
                <textarea
                  className="w-full rounded-lg border px-3 py-2 h-24"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="プランのメモや共有メッセージなど"
                />
              </label>

              {/* 日付 */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="block text-slate-600 mb-1">開始日</span>
                  <input type="date" className="w-full rounded-lg border px-3 py-2"
                    value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="block text-slate-600 mb-1">終了日</span>
                  <input type="date" className="w-full rounded-lg border px-3 py-2"
                    value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </label>
              </div>

              {/* 共同編集者 */}
              <label className="block text-sm">
                <span className="block text-slate-600 mb-1">
                  ユーザー追加（メール複数可・カンマ/空白区切り）
                </span>
                <textarea
                  className="w-full rounded-lg border px-3 py-2 h-24"
                  placeholder="alice@example.com, bob@example.com"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50" onClick={() => setOpen(false)} disabled={pending}>キャンセル</button>
                <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50" disabled={pending}>
                  {pending ? "保存中…" : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
