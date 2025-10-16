"use client";

import { useEffect, useMemo, useState } from "react";

type Project = {
  id: string;
  title: string | null;
  startDate?: string | null;
  endDate?: string | null;
  role?: string | null;
};

export default function PublishToProject({ placeId }: { placeId: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/me/projects", { cache: "no-store" })
      .then(r => r.json())
      .then((rows: Project[]) => { if (mounted) setProjects(rows); });
    return () => { mounted = false; };
  }, []);

  const canSubmit = picked && !busy;
  const current = useMemo(() => projects.find(p => p.id === picked) || null, [projects, picked]);

  async function publish() {
    if (!canSubmit) return;
    setBusy(true);
    const res = await fetch(`/api/projects/${picked}/candidates/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId }),
    });
    setBusy(false);
    if (!res.ok) {
      alert("候補に追加できませんでした");
      return;
    }
    setOpen(false);
  }

  if (!projects.length) {
    // まだ取得中 or プロジェクト無し
  }

  return (
    <div className="mt-2">
      <button
        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-sky-50"
        onClick={() => setOpen(v => !v)}
      >
        候補に出す
      </button>

      {open && (
        <div className="mt-2 rounded-xl border bg-white p-3 shadow-sm">
          {projects.length === 0 ? (
            <div className="text-sm text-slate-500">参加中のプロジェクトがありません。</div>
          ) : (
            <>
              <label className="block text-xs text-slate-600 mb-1">プロジェクトを選択</label>
              <select
                className="w-full rounded-lg border px-2 py-1.5"
                value={picked}
                onChange={(e) => setPicked(e.target.value)}
              >
                <option value="" disabled>選択してください</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title ?? "(無題)"}{/* 期間など入れたければここに */}
                  </option>
                ))}
              </select>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  キャンセル
                </button>
                <button
                  disabled={!canSubmit}
                  onClick={publish}
                  className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white
                             hover:bg-sky-700 disabled:opacity-50"
                >
                  追加する
                  {busy && (
                    <span aria-hidden className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
