// apps/web/src/components/Portal.tsx
"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }: { children: React.ReactNode }) {
  const elRef = useRef<HTMLElement | null>(null);
  if (!elRef.current && typeof document !== "undefined") {
    elRef.current = document.createElement("div");
  }
  useEffect(() => {
    if (!elRef.current) return;
    document.body.appendChild(elRef.current);
    return () => { document.body.removeChild(elRef.current!); };
  }, []);
  return elRef.current ? createPortal(children, elRef.current) : null;
}