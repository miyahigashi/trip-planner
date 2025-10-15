// apps/web/src/app/client-header.tsx
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

// 設定メニューはクライアント専用 & SSR 無効（/_not-found の prerender から切り離す）
const SettingsMenu = dynamic(() => import("@/components/SettingsMenu"), { ssr: false });

export default function ClientHeader() {
  return (
    <header
      className="sticky top-0 z-20 border-b border-white/40 bg-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40"
      style={{ paddingTop: "env(safe-area-inset-top)" }} // iOS ノッチ対策
      aria-label="アプリのヘッダー"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 左：ロゴ */}
          <Link href="/" className="group flex items-center gap-3 outline-none" aria-label="ホームへ戻る">
            <span
              className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br
                         from-sky-400 to-teal-400 text-white shadow-sm ring-1 ring-white/30
                         group-focus-visible:ring-2 group-focus-visible:ring-sky-500"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="size-5">
                <path
                  d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm3.9 6.1-2.1 5.3-5.3 2.1 2.1-5.3 5.3-2.1Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <div className="leading-tight">
              <div className="text-xl font-bold tracking-tight">Trip Planner</div>
              <div className="text-xs text-slate-600">旅の計画と行きたいリスト</div>
            </div>
          </Link>

          {/* 右：設定メニュー（Clerk依存のため SSR 無効） */}
          <SettingsMenu />
        </div>
      </div>

      {/* 下線グラデーション */}
      <div className="h-[3px] w-full bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400" />
    </header>
  );
}
