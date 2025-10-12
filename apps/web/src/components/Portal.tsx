// apps/web/src/components/Portal.tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export default function Portal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);

  // 初回だけ body 直下にコンテナを作成
  if (!elRef.current && typeof document !== "undefined") {
    const el = document.createElement("div");
    // ★ ここで最前面のスタッキングコンテキストを作っておく
    el.style.position = "fixed";
    el.style.inset = "0";
    el.style.zIndex = "2147483647"; // 十分に大きい値
    // 必要に応じて className 付与
    if (className) el.className = className;
    elRef.current = el;
  }

  // マウント/アンマウント
  useEffect(() => {
    if (!elRef.current) return;
    document.body.appendChild(elRef.current);
    return () => {
      elRef.current && document.body.removeChild(elRef.current);
    };
  }, []);

  return elRef.current ? createPortal(children, elRef.current) : null;
}
