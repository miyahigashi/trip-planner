"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PREFECTURES } from "@/lib/regions";

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [prefectures, setPrefectures] = useState<string[]>([]);
  const [invitees, setInvitees] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const togglePref = (p: string) =>
    setPrefectures((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description: description || null,
          startDate: startDate || null,
          endDate: endDate || null,
          prefectures,
          invitees: invitees
            .split(/[,\s]+/)
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "作成に失敗しました");
      }

      // ▼ ここから追加（サマリを使った確認）
      const data = await res.json();
      const projectId = data.projectId as string;
      const membersAdded = Number(data.membersAdded ?? 0);
      const invitesCreated = Number(data.invitesCreated ?? 0);

      router.push(`/projects/${projectId}/members`);
      // ▲ ここまで
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
  }
};

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">新しい旅のプロジェクト</h1>
      <p className="mt-1 text-slate-600 text-sm">
        タイトル・対象都道府県・参加メンバー（任意）を設定します。
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        {/* タイトル */}
        <label className="block space-y-1">
          <span className="text-sm text-gray-600">タイトル（必須）</span>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例）春の北海道旅行 2025"
            required
          />
        </label>

        {/* 説明 */}
        <label className="block space-y-1">
          <span className="text-sm text-gray-600">説明（任意）</span>
          <textarea
            className="w-full rounded-lg border px-3 py-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="計画のメモなど"
          />
        </label>

        {/* 日付 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-sm text-gray-600">開始日（任意）</span>
            <input
              type="date"
              className="w-full rounded-lg border px-3 py-2"
              value={startDate ?? ""}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm text-gray-600">終了日（任意）</span>
            <input
              type="date"
              className="w-full rounded-lg border px-3 py-2"
              value={endDate ?? ""}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>

        {/* 都道府県（複数） */}
        <div>
          <div className="mb-2 text-sm text-gray-600">対象の都道府県（複数選択可・後で変更可）</div>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
            {PREFECTURES.map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={prefectures.includes(p)}
                  onChange={() => togglePref(p)}
                />
                <span>{p}</span>
              </label>
            ))}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            ※ 1つ以上選ぶと、メンバーのウィッシュリストから該当都道府県だけが候補になります
          </div>
        </div>

        <div className="flex justify-end gap-3">
            {/* キャンセル（赤・アウトライン） */}
            <button
                type="button"
                onClick={() => history.back()}
                disabled={submitting}
                className="
                inline-flex h-10 w-32 items-center justify-center
                rounded-xl border border-red-400 text-red-700
                text-sm font-medium
                hover:bg-red-50
                focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
                disabled:opacity-50
                "
            >
                キャンセル
            </button>

            {/* 作成（緑・塗りつぶし） */}
            <button
                type="submit"
                disabled={submitting || !title || prefectures.length === 0}
                className="
                inline-flex h-10 w-32 items-center justify-center
                rounded-xl bg-emerald-600 text-white
                text-sm font-medium
                hover:bg-emerald-700
                focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2
                disabled:opacity-50
                "
            >
                {submitting ? "作成中…" : "作成"}
            </button>
            </div>

      </form>
    </main>
  );
}
