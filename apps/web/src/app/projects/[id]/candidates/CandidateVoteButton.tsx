// apps/web/src/app/projects/[id]/candidates/CandidateVoteButton.tsx
"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
type Props = {
  projectId: string;
  placeId: string;
  initialVoted: boolean;
  initialCount?: number;
  className?: string; // ← これを追加
};

export default function CandidateVoteButton({
  projectId,
  placeId,
  initialVoted,
  initialCount = 0,
  className = "",
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);

  const toggle = (next: boolean) =>
    start(async () => {
      const prevV = voted, prevC = count;
      setVoted(next);
      setCount(c => Math.max(0, c + (next ? 1 : -1)));

      const res = await fetch(`/api/projects/${projectId}/candidates/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, op: next ? "add" : "remove" }),
      });

      if (!res.ok) {
        setVoted(prevV);
        setCount(prevC);
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "更新に失敗しました");
        return;
      }

      const data = await res.json().catch(() => null);
      if (data && typeof data.voted === "boolean" && typeof data.votes === "number") {
        setVoted(data.voted);
        setCount(data.votes);
      } else {
        router.refresh();
      }
    });

  return (
    <button
        type="button"
        onClick={() => toggle(!voted)}
        disabled={pending}
        aria-pressed={voted}
        aria-label={voted ? "賛成を取り消す" : "賛成する"}
        className={[
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm transition disabled:opacity-50",
            voted
            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
            : "text-slate-600 hover:bg-slate-50 border-slate-300",
        ].join(" ")}
        >
        <span aria-hidden className="text-base leading-none">👍</span>
        <span
            aria-hidden
            className={[
            "min-w-5 px-1 text-xs leading-5 tabular-nums text-center rounded-full border",
            voted ? "border-emerald-300" : "border-slate-300",
            ].join(" ")}
        >
            {count}
        </span>
        <span className="sr-only">{voted ? "賛成を取り消す" : "賛成する"}</span>
        </button>
  );
}