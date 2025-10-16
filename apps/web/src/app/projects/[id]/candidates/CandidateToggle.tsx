"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function CandidateToggle({
  projectId,
  placeId,
  initial,           // 現在「候補か」
  isSelected = false // 現在「確定か」（バッジ表示用に既に持っているはず）
}: {
  projectId: string;
  placeId: string;
  initial: boolean;
  isSelected?: boolean;
}) {
  const router = useRouter();
  const [isOn, setOn] = useState(initial);
  const [pending, start] = useTransition();

  const add = () =>
    start(async () => {
      setOn(true);
      const r = await fetch(`/api/projects/${projectId}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId }),
      });
      if (!r.ok) {
        setOn(false);
        alert("候補に追加できませんでした");
        return;
      }
      router.refresh();
    });

  const remove = () =>
    start(async () => {
      // もし確定中なら、同時に確定も解除するか確認
      let alsoUnselect = false;
      if (isSelected) {
        const ok = window.confirm(
          "このスポットは現在『確定』にも入っています。\n候補を取り消すと同時に、確定からも外しますか？"
        );
        if (!ok) return;
        alsoUnselect = true;
      }

      setOn(false);
      const url = new URL(
        `/api/projects/${projectId}/candidates`,
        window.location.origin
      );
      url.searchParams.set("placeId", placeId);
      if (alsoUnselect) url.searchParams.set("alsoUnselect", "1");

      const r = await fetch(url.toString(), { method: "DELETE" });
      if (!r.ok) {
        setOn(true);
        alert("候補を取り消せませんでした");
        return;
      }
      router.refresh();
    });

  return isOn ? (
    <button
      className="rounded-lg border px-3 py-1.5 text-sm bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
      onClick={remove}
      disabled={pending}
      aria-label="候補を取り消す"
    >
      {pending ? "処理中…" : "✓ 候補（取り消す）"}
    </button>
  ) : (
    <button
      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
      onClick={add}
      disabled={pending}
      aria-label="候補に追加"
    >
      {pending ? "追加中…" : "候補に追加"}
    </button>
  );
}
