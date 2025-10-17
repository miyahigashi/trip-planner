"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/Confirm";

type Props = {
  projectId: string;
  placeId: string;
  selected: boolean;
  confirmDemote?: boolean;
  className?: string;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function SelectToggle({
  projectId,
  placeId,
  selected,
  confirmDemote = false,
  className,
}: Props) {
  const router = useRouter();
  const confirm = useConfirm();

  // ✅ 通信中はこれで管理（useTransitionはUIのrefreshだけに使う）
  const [isMutating, setIsMutating] = useState(false);
  const [isRefreshing, startTransition] = useTransition();

  const call = (action: "select" | "unselect" | "unselect_and_uncandidate") =>
    fetch(`/api/projects/${projectId}/selections/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ placeId, action }),
    });

  const onSelect = async () => {
    setIsMutating(true);
    try {
      const r = await call("select");
      if (!r.ok) throw new Error("failed");
      // UIの再取得だけをトランジションに
      startTransition(() => router.refresh());
    } finally {
      setIsMutating(false);
    }
  };

  const onUnselect = async () => {
    setIsMutating(true);
    try {
      let action: "unselect" | "unselect_and_uncandidate" = "unselect";
      if (confirmDemote) {
        const ok = await confirm({
          title: "確認",
          description: "確定を取り消して候補からも外しますか？（OKで両方解除）",
          confirmText: "OK",
          cancelText: "キャンセル",
          tone: "danger",
        });
        if (!ok) return; // ❗️ finally で isMutating は戻る
        action = "unselect_and_uncandidate";
      }
      const r = await call(action);
      if (!r.ok) throw new Error("failed");
      startTransition(() => router.refresh());
    } finally {
      setIsMutating(false);
    }
  };

  const base =
    "h-10 w-full rounded-lg px-3 text-sm font-semibold text-center whitespace-nowrap transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variant = selected
    ? "bg-indigo-600 text-white hover:bg-indigo-700"
    : "border hover:bg-gray-50";

  const disabled = isMutating || isRefreshing;

  return (
    <button
      onClick={selected ? onUnselect : onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(base, variant, className)}
    >
      {selected ? (
        <>
          <span className="sm:hidden">{disabled ? "解除中…" : "確定解除"}</span>
          <span className="hidden sm:inline">
            {disabled ? "取り消し中…" : "確定を取り消す"}
          </span>
        </>
      ) : (
        <>
          <span className="sm:hidden">{disabled ? "追加中…" : "確定にする"}</span>
          <span className="hidden sm:inline">
            {disabled ? "追加中…" : "確定にする"}
          </span>
        </>
      )}
    </button>
  );
}
