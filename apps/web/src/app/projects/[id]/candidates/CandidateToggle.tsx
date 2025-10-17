"use client";
// apps/web/src/app/projects/[id]/candidates/CandidateToggle.tsx
import * as React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/Confirm";

type ButtonProps = React.ComponentProps<"button">;

type Props = {
  projectId: string;
  placeId: string;
  initial: boolean;              // 初期の候補状態
  isSelected?: boolean;          // 確定中なら解除確認に使用
  className?: string;

  // controlled props
  pressed?: boolean;
  onPressedChange?: (next: boolean) => void;
} & Omit<ButtonProps, "onClick" | "disabled" | "children" | "value">;

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function CandidateToggle({
  projectId,
  placeId,
  initial,
  isSelected = false,
  className,
  pressed,
  onPressedChange,
  ...rest
}: Props) {
  const router = useRouter();
  const confirm = useConfirm();

  // ✅ 通信中の管理は自前
  const [isMutating, setIsMutating] = useState(false);
  // ✅ 画面再取得だけをトランジションに
  const [isRefreshing, startTransition] = useTransition();

  // controlled / uncontrolled 両対応
  const isControlled =
    typeof pressed === "boolean" && typeof onPressedChange === "function";
  const [internal, setInternal] = useState(initial);
  const isOn = isControlled ? (pressed as boolean) : internal;

  const setNext = (next: boolean) => {
    if (isControlled) onPressedChange?.(next);
    else setInternal(next);
  };

  const add = async () => {
    setIsMutating(true);
    const prev = isOn;
    try {
      setNext(true); // 楽観更新
      const r = await fetch(`/api/projects/${projectId}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId }),
      });
      if (!r.ok) {
        setNext(prev);
        throw new Error("候補に追加できませんでした");
      }
      startTransition(() => router.refresh());
    } catch (e) {
      // 必要ならトーストなどに置き換え
      alert((e as Error).message);
    } finally {
      setIsMutating(false);
    }
  };

  const remove = async () => {
    setIsMutating(true);
    const prev = isOn;
    try {
      let alsoUnselect = false;
      if (isSelected) {
        const ok = await confirm({
          title: "確認",
          description:
            "このスポットは現在『確定』にも入っています。\n候補を取り消すと同時に、確定からも外しますか？",
          confirmText: "OK",
          cancelText: "キャンセル",
          tone: "danger",
        });
        if (!ok) return; // finally で解除される
        alsoUnselect = true;
      }

      setNext(false); // 楽観更新

      const url = new URL(
        `/api/projects/${projectId}/candidates`,
        window.location.origin
      );
      url.searchParams.set("placeId", placeId);
      if (alsoUnselect) url.searchParams.set("alsoUnselect", "1");

      const r = await fetch(url.toString(), { method: "DELETE" });
      if (!r.ok) {
        setNext(prev);
        throw new Error("候補を取り消せませんでした");
      }
      startTransition(() => router.refresh());
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setIsMutating(false);
    }
  };

  const disabled = isMutating || isRefreshing;

  return (
    <button
      onClick={isOn ? remove : add}
      disabled={disabled}
      aria-pressed={isOn}
      className={cn(
        "h-10 rounded-lg px-3 text-sm text-center whitespace-nowrap transition disabled:opacity-50 disabled:cursor-not-allowed",
        isOn
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          : "border hover:bg-gray-50",
        className
      )}
      {...rest}
    >
      {isOn
        ? disabled
          ? "処理中…"
          : "✓ 候補（取り消す）"
        : disabled
          ? "追加中…"
          : "候補にする"}
    </button>
  );
}
