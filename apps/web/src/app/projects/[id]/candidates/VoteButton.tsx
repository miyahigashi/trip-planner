"use client";

import { useOptimistic, useTransition } from "react";
import { useState } from "react";

export default function VoteButton({
  projectId,
  placeId,
  initialVotes,
  initialVotedByMe,
}: {
  projectId: string;
  placeId: string;
  initialVotes: number;
  initialVotedByMe: boolean;
}) {
  const [pending, start] = useTransition();
  const [serverState, setServerState] = useState({
    votes: initialVotes,
    votedByMe: initialVotedByMe,
  });

  const [optimistic, setOptimistic] = useOptimistic(serverState);

  const toggle = (nextOn: boolean) =>
    start(async () => {
      // 楽観更新
      setOptimistic((s) => ({
        votedByMe: nextOn,
        votes: s.votes + (nextOn ? 1 : -1),
      }));

      try {
        const r = await fetch(`/api/projects/${projectId}/candidates/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ placeId, on: nextOn }),
          cache: "no-store",
        });
        if (!r.ok) throw new Error("failed");
        const data = (await r.json()) as { votes: number; votedByMe: boolean };
        setServerState(data);
        setOptimistic(data);
      } catch {
        // 失敗時は元に戻す
        setOptimistic(serverState);
      }
    });

  const on = optimistic.votedByMe;

  return (
    <button
      type="button"
      onClick={() => toggle(!on)}
      disabled={pending}
      className={[
        "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm",
        on
          ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
          : "hover:bg-gray-50",
      ].join(" ")}
      aria-pressed={on}
      aria-label={on ? "賛成を取り消す" : "賛成する"}
      title={on ? "賛成を取り消す" : "賛成する"}
    >
      {on ? "👍 賛成中" : "👍 賛成"} <span className="ml-1 text-xs">{optimistic.votes}</span>
    </button>
  );
}
