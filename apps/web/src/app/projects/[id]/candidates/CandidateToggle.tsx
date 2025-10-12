// apps/web/src/app/projects/[id]/candidates/CandidateToggle.tsx
"use client";

import { useState, useTransition } from "react";

export default function CandidateToggle({
  projectId, placeId, initial,
}: { projectId: string; placeId: string; initial: boolean }) {
  const [isOn, setOn] = useState(initial);
  const [pending, start] = useTransition();

  const add = () => start(async () => {
    setOn(true);
    const r = await fetch(`/api/projects/${projectId}/candidates`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId }),
    });
    if (!r.ok) setOn(false);
  });

  const remove = () => start(async () => {
    setOn(false);
    const r = await fetch(`/api/projects/${projectId}/candidates?placeId=${encodeURIComponent(placeId)}`, {
      method: "DELETE",
    });
    if (!r.ok) setOn(true);
  });

  return isOn ? (
    <button
      className="rounded-lg border px-3 py-1.5 text-sm bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
      onClick={remove}
      disabled={pending}
      aria-label="候補を取り消す"
    >
      ✓ 候補に追加済み（取り消す）
    </button>
  ) : (
    <button
      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
      onClick={add}
      disabled={pending}
      aria-label="候補に追加"
    >
      候補に追加
    </button>
  );
}
