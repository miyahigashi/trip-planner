"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  projectId: string;
  placeId: string;
  selected: boolean;              // 現在「確定」状態か
  // 確定→取り消し時に候補からも外す確認を出す場合は true
  confirmDemote?: boolean;
};

export default function SelectToggle({
  projectId,
  placeId,
  selected,
  confirmDemote = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const call = (action: "select" | "unselect" | "unselect_and_uncandidate") =>
    fetch(`/api/projects/${projectId}/selections/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ placeId, action }),
    });

  const onSelect = () =>
    startTransition(async () => {
      await call("select");
      router.refresh(); // SSR一覧を再取得
    });

  const onUnselect = () =>
    startTransition(async () => {
      let action: "unselect" | "unselect_and_uncandidate" = "unselect";
      if (confirmDemote) {
        const ok = window.confirm(
          "確定を取り消して候補からも外しますか？（OKで両方解除）"
        );
        if (!ok) return;
        action = "unselect_and_uncandidate";
      }
      await call(action);
      router.refresh();
    });

  return selected ? (
    <button
      onClick={onUnselect}
      disabled={pending}
      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
    >
      {pending ? "取り消し中…" : "確定を取り消す"}
    </button>
  ) : (
    <button
      onClick={onSelect}
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? "追加中…" : "確定にする"}
    </button>
  );
}
