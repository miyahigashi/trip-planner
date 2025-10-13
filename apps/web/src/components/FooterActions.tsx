// apps/web/src/components/FooterActions.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AddWishlistLink from "@/components/AddWishlistLink";

/**
 * 画面下に常時固定されるアクションバー。
 * - モバイル: アイコンのみ / フル幅
 * - PC: ラベル付きのコンパクトバー
 */
export default function FooterActions() {
  const pathname = usePathname();
  const onWishlists = pathname?.startsWith("/wishlists");
  const isList = pathname === "/wishlists";
  const isMap = pathname === "/wishlists/map";

  const btnBase =
    "inline-flex items-center justify-center rounded-xl shadow-sm " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500";
  const mobBtn = `${btnBase} size-10 border border-white/60 bg-white/80`;
  const pcBtn  = "inline-flex items-center rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm shadow-sm hover:bg-white";

  return (
    <>
      {/* 固定ボトムバー */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="フッターメニュー"
      >
        <div className="mx-auto max-w-6xl px-4">
          {/* モバイル: アイコンのみ・等間隔 */}
          <nav className="flex h-14 items-center justify-around md:hidden">
            {/* ホーム */}
            <Link href="/" className={mobBtn} aria-label="ホーム">
              <svg viewBox="0 0 24 24" className="size-5 text-slate-700" aria-hidden>
                <path d="M12 3 3 10h2v8h5v-5h4v5h5v-8h2L12 3z" fill="currentColor" />
              </svg>
            </Link>

            {/* Wishlists（リスト） */}
            <Link
              href="/wishlists"
              className={[mobBtn, onWishlists && isList ? "ring-2 ring-sky-500" : ""].join(" ")}
              aria-label="リストで見る"
            >
              {/* list icon */}
              <svg viewBox="0 0 24 24" className="size-5 text-slate-700" aria-hidden>
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z" fill="currentColor" />
              </svg>
            </Link>

            {/* マップ */}
            <Link
              href="/wishlists/map"
              className={[mobBtn, onWishlists && isMap ? "ring-2 ring-sky-500" : ""].join(" ")}
              aria-label="マップで見る"
            >
              <svg viewBox="0 0 24 24" className="size-5 text-slate-700" aria-hidden>
                <path d="M12 22s7-5.33 7-12a7 7 0 1 0-14 0c0 6.67 7 12 7 12Zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" fill="currentColor" />
              </svg>
            </Link>

            {/* 追加 */}
            <AddWishlistLink
              aria-label="Wishlistsに追加"
              iconOnly
              className="size-10 rounded-xl text-white bg-gradient-to-r from-sky-500 to-teal-500 shadow-[0_10px_24px_-10px_rgba(14,165,233,.7)]"
            />
          </nav>

          {/* PC: ラベル付き・右寄せ */}
          <nav className="hidden md:flex h-16 items-center justify-end gap-2">
            <Link href="/" className={pcBtn}>🏠 ホーム</Link>

            <Link
              href="/wishlists"
              className={[pcBtn, onWishlists && isList ? "ring-2 ring-sky-500" : ""].join(" ")}
            >
              📋 リスト
            </Link>

            <Link
              href="/wishlists/map"
              className={[pcBtn, onWishlists && isMap ? "ring-2 ring-sky-500" : ""].join(" ")}
            >
              🗺️ マップ
            </Link>

            <AddWishlistLink
              className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-teal-500 shadow-[0_10px_24px_-10px_rgba(14,165,233,.7)] hover:brightness-110"
            label="Wishlistsに追加"/>
          </nav>
        </div>
      </div>

      {/* ボトムバーの下に隠れないように余白を確保（モバイル） */}
      <div className="h-[calc(56px+env(safe-area-inset-bottom))] md:h-16" />
    </>
  );
}
