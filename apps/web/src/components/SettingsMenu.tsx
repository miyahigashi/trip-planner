// apps/web/src/components/SettingsMenu.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, SignOutButton } from "@clerk/nextjs";

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const pathname = usePathname();
  const search = useSearchParams();

  // 外クリック & Esc で閉じる
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (open && e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // ルート変化（戻る/進む含む）で自動的に閉じる
  useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search?.toString()]);

  return (
    <div className="relative">
      {/* 未サインイン：サインインボタンのみ */}
      <SignedOut>
        <SignInButton mode="modal" fallbackRedirectUrl="/">
          <button
            className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            aria-label="サインイン"
          >
            サインイン
          </button>
        </SignInButton>
      </SignedOut>

      {/* サインイン済み：ハンバーガー */}
      <SignedIn>
        <button
          ref={btnRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          className="inline-flex items-center justify-center rounded-xl border px-2.5 py-2 text-slate-700 hover:bg-slate-50"
          aria-label="設定メニューを開く"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="opacity-90">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        {open && (
          <div
            ref={panelRef}
            role="menu"
            aria-label="設定メニュー"
            className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-xl backdrop-blur-sm z-50"
          >
            <div className="p-1">
              <MenuItem href="/projects" label="旅の計画一覧" onSelect={() => setOpen(false)} />
              <MenuItem href="/wishlists" label="ウィッシュリスト" onSelect={() => setOpen(false)} />
              <MenuItem href="/dashboard" label="地図ダッシュボード" onSelect={() => setOpen(false)} />
              <MenuItem href="/profile" label="プロフィール設定" onSelect={() => setOpen(false)} />
              <MenuItem href="/friends" label="フレンド" onSelect={() => setOpen(false)} />
            </div>

            <div className="my-1 h-px bg-slate-200/70" />

            <div className="p-1">
              <SignOutButton redirectUrl="/">
                <button
                  role="menuitem"
                  className="w-full rounded-xl bg-rose-50 px-3 py-2 text-left text-[13px] font-semibold text-rose-700 hover:bg-rose-100"
                  onClick={() => setOpen(false)}
                >
                  サインアウト
                </button>
              </SignOutButton>
            </div>
          </div>
        )}
      </SignedIn>
    </div>
  );
}

function MenuItem({
  href,
  label,
  onSelect,
}: {
  href: string;
  label: string;
  onSelect?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="block w-full rounded-xl px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
      onClick={onSelect}
    >
      {label}
    </Link>
  );
}
