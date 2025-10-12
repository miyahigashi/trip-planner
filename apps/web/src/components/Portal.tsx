// apps/web/src/components/Portal.tsx
"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Portal({
  children,
  className = "app-overlay-root",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);

  if (!elRef.current && typeof document !== "undefined") {
    elRef.current = document.createElement("div");
    if (className) elRef.current.className = className;
  }

  useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);
    return () => {
      try {
        document.body.removeChild(el);
      } catch {}
    };
  }, []);

  return elRef.current ? createPortal(children, elRef.current) : null;
}
