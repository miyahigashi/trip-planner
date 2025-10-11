"use client";

import { useEffect, useState } from "react";

export default function DebugWidth() {
  const [w, setW] = useState<number | null>(null);
  useEffect(() => {
    const f = () => setW(window.innerWidth);
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 70,
        left: 8,
        zIndex: 9999,
        background: "rgba(0,0,0,.6)",
        color: "#fff",
        padding: "2px 6px",
        fontSize: 12,
        borderRadius: 6,
      }}
    >
      width: {w}
    </div>
  );
}
