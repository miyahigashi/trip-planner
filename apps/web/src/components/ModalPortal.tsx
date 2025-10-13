// apps/web/src/components/ModalPortal.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function ModalPortal({ children }: { children: React.ReactNode }) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  if (!elRef.current) {
    elRef.current = document.createElement("div");
    elRef.current.className = "app-modal-root";
  }

  useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);
    setMounted(true);
    return () => {
      setMounted(false);
      el.remove();
    };
  }, []);

  return mounted ? createPortal(children, elRef.current!) : null;
}
