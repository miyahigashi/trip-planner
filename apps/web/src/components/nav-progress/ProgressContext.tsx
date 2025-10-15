// apps/web/src/components/nav-progress/ProgressContext.tsx
"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Ctx = { start: (href?: string) => void; done: () => void; pendingHref: string | null };
const C = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const value = useMemo<Ctx>(() => ({
    start: (href) => setPendingHref(href ?? "__any__"),
    done: () => setPendingHref(null),
    pendingHref
  }), [pendingHref]);

  // ルートが変わったら終了
  useEffect(() => { setPendingHref(null); }, [pathname]);

  return (
    <C.Provider value={value}>
      <TopBar active={!!pendingHref} />
      {children}
    </C.Provider>
  );
}

export function useNavProgress() {
  const v = useContext(C);
  if (!v) throw new Error("useNavProgress must be used within ProgressProvider");
  return v;
}

// 極細プログレスバー（NProgress風）
function TopBar({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className={`fixed left-0 top-0 z-[9999] h-0.5 w-full transition-opacity duration-200
                  ${active ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      <div
        className={`h-full bg-gradient-to-r from-sky-500 to-teal-500
                    transition-[width] duration-[2000ms] ease-out`}
        style={{ width: active ? "90%" : "0%" }}
      />
    </div>
  );
}
