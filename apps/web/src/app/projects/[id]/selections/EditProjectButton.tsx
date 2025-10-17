"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// 都道府県一覧（必要に応じて短縮可能）
const PREFS = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県",
  "滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県",
  "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

type Props = {
  projectId: string;
  initialTitle?: string;
  initialDescription?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  /** ← 追加: 既に設定済みの都道府県 */
  initialPrefectures?: string[];
};

export default function EditProjectButton({
  projectId,
  initialTitle = "",
  initialDescription = "",
  initialStartDate = "",
  initialEndDate = "",
  initialPrefectures = [],
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [prefectures, setPrefectures] = useState<string[]>([]);

  // 初期値反映
  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
    setPrefectures(initialPrefectures);
  }, [initialTitle, initialDescription, initialStartDate, initialEndDate, initialPrefectures]);

  // バリデーション
  const errors = useMemo(() => {
    const es: string[] = [];
    if (!title.trim()) es.push("タイトルは必須です。");
    if (!startDate || !endDate) {
      es.push("開始日と終了日は必須です。");
    } else if (startDate > endDate) {
      es.push("終了日は開始日以降を指定してください。");
    }
    if (prefectures.length < 1) es.push("都道府県を1つ以上選択してください。");
    return es;
  }, [title, startDate, endDate, prefectures]);

  const isValid = errors.length === 0;

  function togglePref(p: string) {
    setPrefectures((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    start(async () => {
      try {
        // 1) メタ更新
        {
          const res = await fetch(`/api/projects/${projectId}/meta`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              title: title.trim(),
              description: description.trim() || null,
              startDate,
              endDate,
            }),
          });
          if (!res.ok) throw new Error((await safeMsg(res)) || "プロジェクトの更新に失敗しました。");
        }

        // 2) 都道府県更新（必須）
        {
          const res = await fetch(`/api/projects/${projectId}/prefectures`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ prefectures }),
          });
          if (!res.ok) throw new Error((await safeMsg(res)) || "都道府県の更新に失敗しました。");
        }

        setOpen(false);
        router.refresh();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "保存に失敗しました。");
        console.error("[EditProjectButton] submit failed:", err);
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
        ⚙️ 設定
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => !pending && setOpen(false)}
        >
          <div className="flex min-h-[100svh] items-center justify-center p-4">
            <div
              className="w-full max-w-lg max-h-[min(90svh,680px)] flex flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="設定の変更"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <h3 className="text-base font-semibold">設定の変更</h3>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <form onSubmit={onSubmit} className="flex-1 overflow-y-auto">
                <div className="space-y-4 px-4 py-3">
                  {/* タイトル（必須） */}
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-600">タイトル<span className="text-rose-600">*</span></span>
                    <input
                      type="text"
                      className="w-full rounded-lg border px-3 py-2"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="旅のタイトル"
                      required
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

                  {/* 日付（必須） */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-600">開始日<span className="text-rose-600">*</span></span>
                      <input
                        type="date"
                        className="w-full rounded-lg border px-3 py-2"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-600">終了日<span className="text-rose-600">*</span></span>
                      <input
                        type="date"
                        className="w-full rounded-lg border px-3 py-2"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </label>
                  </div>

                  {/* 都道府県（1つ以上必須） */}
                  <div className="text-sm">
                    <div className="mb-1 text-slate-600">
                      都道府県 <span className="text-rose-600">*</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PREFS.map((p) => {
                        const checked = prefectures.includes(p);
                        return (
                          <label
                            key={p}
                            className={`cursor-pointer select-none rounded-full border px-3 py-1 ${
                              checked
                                ? "bg-sky-600 text-white border-sky-600"
                                : "bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() => togglePref(p)}
                            />
                            {p}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* エラー表示 */}
                  {errors.length > 0 && (
                    <ul className="space-y-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {errors.map((e) => (
                        <li key={e}>• {e}</li>
                      ))}
                    </ul>
                  )}

                  {/* フッターに隠れない余白 */}
                  <div className="pb-24" />
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 border-t bg-white/95 px-4 py-3 backdrop-blur pb-[calc(env(safe-area-inset-bottom)+0.25rem)]">
                  <div className="flex justify-end gap-2">
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
                      disabled={pending || !isValid}
                    >
                      {pending ? "保存中…" : "保存"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
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
    return typeof (data as any)?.error === "string"
      ? (data as any).error
      : typeof (data as any)?.message === "string"
      ? (data as any).message
      : null;
  } catch {
    try {
      return await res.text();
    } catch {
      return null;
    }
  }
}
