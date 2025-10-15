// apps/web/src/components/HeaderActions.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AddWishlistLink from "@/components/AddWishlistLink";
import NavLink from "@/components/NavLink";

type Props = { className?: string };

// ルート遷移の保留表示用: クリック後、pathname が変わるまで pending にする
function usePendingNav() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // 遷移が完了（= pathname が変わった）したら pending を解除
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return {
    isPending: (href: string) => pendingHref === href,
    startPending: (href: string) => setPendingHref(href),
  };
}

export default function HeaderActions({ className = "" }: Props) {
  const pathname = usePathname() ?? "/";
  const onWishlists = pathname.startsWith("/wishlists");
  const { isPending, startPending } = usePendingNav();

  const baseBtn =
    "inline-flex items-center gap-2 shrink-0 whitespace-nowrap rounded-xl " +
    "border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-700 shadow-sm " +
    "transition active:translate-y-[1px] active:shadow-none " +
    "hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500";

  const iconBtn =
    "inline-flex items-center justify-center rounded-xl border border-white/60 " +
    "bg-white/70 p-2 text-slate-700 shadow-sm transition " +
    "active:translate-y-[1px] active:shadow-none hover:bg-white " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500";

  const pendingBadge =
    "ml-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-400/60 border-t-transparent";

  return (
    <nav className={`flex flex-nowrap items-center gap-2 ${className}`}>
      {/* ホーム（アイコン） */}
      <NavLink
        href="/"
        aria-label="ホーム"
        aria-current={pathname === "/" ? "page" : undefined}
        className={`md:hidden ${iconBtn} ${pathname === "/" ? "ring-2 ring-sky-500" : ""}`}
        onClick={() => startPending("/")}
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path d="M12 3 3 10h2v8h5v-5h4v5h5v-8h2L12 3z" fill="currentColor" />
        </svg>
      </NavLink>

      {/* ホーム（テキスト） */}
      <NavLink
        href="/"
        aria-current={pathname === "/" ? "page" : undefined}
        className={`hidden md:inline-flex ${baseBtn} ${pathname === "/" ? "ring-2 ring-sky-500" : ""}`}
        onClick={() => startPending("/")}
      >
        🏠 ホーム
        {isPending("/") && <span className={pendingBadge} aria-hidden />}
      </NavLink>

      {/* Wishlists 一覧 */}
      <NavLink
        href="/wishlists"
        aria-current={onWishlists && pathname === "/wishlists" ? "page" : undefined}
        className={`hidden md:inline-flex ${baseBtn} ${onWishlists && pathname === "/wishlists" ? "ring-2 ring-sky-500" : ""}`}
        onClick={() => startPending("/wishlists")}
      >
        📌 Wishlists
        {isPending("/wishlists") && <span className={pendingBadge} aria-hidden />}
      </NavLink>

      {/* マップ（アイコン） */}
      <NavLink
        href="/wishlists/map"
        aria-label="マップで見る"
        aria-current={pathname === "/wishlists/map" ? "page" : undefined}
        className={`md:hidden ${iconBtn} ${pathname === "/wishlists/map" ? "ring-2 ring-sky-500" : ""}`}
        onClick={() => startPending("/wishlists/map")}
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path d="M12 22s7-5.33 7-12a7 7 0 1 0-14 0c0 6.67 7 12 7 12Zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" fill="currentColor" />
        </svg>
      </NavLink>

      {/* マップ（テキスト） */}
      <Link
        href="/wishlists/map"
        aria-current={pathname === "/wishlists/map" ? "page" : undefined}
        className={`hidden md:inline-flex ${baseBtn} ${pathname === "/wishlists/map" ? "ring-2 ring-sky-500" : ""}`}
        onClick={() => startPending("/wishlists/map")}
      >
        🗺️ マップで見る
        {isPending("/wishlists/map") && <span className={pendingBadge} aria-hidden />}
      </Link>

      {/* Wishlists 追加（既存の AddWishlistLink も押し込み&リングを統一） */}
      <AddWishlistLink
        aria-label="Wishlistsに追加"
        iconOnly
        className="md:hidden inline-flex items-center justify-center rounded-xl p-2 shrink-0
                   bg-gradient-to-r from-sky-500 to-teal-500 text-white
                   shadow-[0_6px_20px_-6px_rgba(14,165,233,.6)]
                   transition active:translate-y-[1px] active:shadow-none
                   hover:brightness-110 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-sky-500"
      />
      <AddWishlistLink
        label="Wishlistsに追加"
        className="hidden md:inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold
                   text-white bg-gradient-to-r from-sky-500 to-teal-500 shrink-0
                   shadow-[0_6px_20px_-6px_rgba(14,165,233,.6)]
                   transition active:translate-y-[1px] active:shadow-none
                   hover:brightness-110 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-sky-500"
      />
    </nav>
  );
}
