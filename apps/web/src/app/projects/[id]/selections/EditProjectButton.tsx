"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  projectId: string;
  initialTitle?: string;
  initialDescription?: string;
  initialStartDate?: string; // YYYY-MM-DD
  initialEndDate?: string;   // YYYY-MM-DD
};

export default function EditProjectButton({
  projectId,
  initialTitle = "",
  initialDescription = "",
  initialStartDate = "",
  initialEndDate = "",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  // フォーム値
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [emails, setEmails] = useState(""); // カンマ/空白区切り

  // 初期値を反映
  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
  }, [initialTitle, initialDescription, initialStartDate, initialEndDate]);

  // 送信処理
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 軽いバリデーション
    if (startDate && endDate && startDate > endDate) {
      alert("終了日は開始日以降を指定してください。");
      return;
    }

    const inviteEmails = emails
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    start(async () => {
      try {
        // 1) メタ更新
        {
          const res = await fetch(`/api/projects/${projectId}/meta`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              title: title?.trim() || null,
              description: description?.trim() || null,
              startDate: startDate || null,
              endDate: endDate || null,
            }),
          });
          if (!res.ok) {
            const msg = await safeMsg(res);
            throw new Error(msg || "プロジェクトの更新に失敗しました。");
          }
        }

        // 2) メンバー招待
        if (inviteEmails.length > 0) {
          const res2 = await fetch(`/api/projects/${projectId}/members/bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ emails: inviteEmails }),
          });
          if (!res2.ok) {
            const msg = await safeMsg(res2);
            throw new Error(msg || "メンバーの追加に失敗しました。");
          }
        }

        setOpen(false);
        router.refresh();
      } catch (err: unknown) {
        console.error("[EditProjectButton] submit failed:", err);
        alert(err instanceof Error ? err.message : "保存に失敗しました。");
      }
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
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">プロジェクトを編集</h3>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-700"
                onClick={() => setOpen(false)}
                disabled={pending}
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {/* タイトル */}
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">タイトル</span>
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
                <span className="mb-1 block text-slate-600">説明</span>
                <textarea
                  className="h-24 w-full rounded-lg border px-3 py-2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="プランのメモや共有メッセージなど"
                />
              </label>

              {/* 日付 */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-600">開始日</span>
                  <input
                    type="date"
                    className="w-full rounded-lg border px-3 py-2"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-600">終了日</span>
                  <input
                    type="date"
                    className="w-full rounded-lg border px-3 py-2"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </label>
              </div>

              {/* 共同編集者 */}
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">
                  ユーザー追加（メール複数可・カンマ/空白区切り）
                </span>
                <textarea
                  className="h-24 w-full rounded-lg border px-3 py-2"
                  placeholder="alice@example.com, bob@example.com"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  disabled={pending}
                >
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

/** レスポンス本文を安全に文字列化 */
async function safeMsg(res: Response): Promise<string | null> {
  try {
    const data = await res.json();
    return typeof data?.error === "string"
      ? data.error
      : typeof data?.message === "string"
      ? data.message
      : null;
  } catch {
    try {
      return await res.text();
    } catch {
      return null;
    }
  }
}
