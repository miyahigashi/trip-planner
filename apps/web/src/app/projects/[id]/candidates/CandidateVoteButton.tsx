// apps/web/src/app/projects/[id]/candidates/CandidateVoteButton.tsx
"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  projectId: string;
  placeId: string;
  initialVoted: boolean;
  initialCount?: number;
  className?: string;
};

export default function CandidateVoteButton({
  projectId,
  placeId,
  initialVoted,
  initialCount = 0,
  className = "",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);

  async function doToggle(next: boolean) {
    // 1) 楽観更新（必ず即時反映）
    setVoted(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));

    // 2) サーバ確定
    const res = await fetch(`/api/projects/${projectId}/candidates/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, op: next ? "add" : "remove" }),
      cache: "no-store",
    });

    if (!res.ok) {
      // 失敗時は元に戻す
      setVoted((v) => !v);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "更新に失敗しました");
      return;
    }

    // 3) サーバの確定値で上書き（もし差分があれば吸収）
    const data = await res.json().catch(() => null);
    if (data && typeof data.voted === "boolean" && typeof data.votes === "number") {
      setVoted(data.voted);
      setCount(data.votes);
    }

    // 4) 最後にSSRを同期（初回だけ反映されない等のズレを根こそぎ解消）
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={() => doToggle(!voted)}
      disabled={pending}
      aria-pressed={voted}
      aria-label={voted ? "賛成を取り消す" : "賛成する"}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm transition disabled:opacity-50",
        voted
          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
          : "text-slate-600 hover:bg-slate-50 border-slate-300",
        className,
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
