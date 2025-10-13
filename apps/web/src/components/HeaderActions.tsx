// apps/web/src/components/HeaderActions.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AddWishlistLink from "@/components/AddWishlistLink";

type Props = {
  className?: string;
};

export default function HeaderActions({ className = "" }: Props) {
  const pathname = usePathname() ?? "/";
  const onWishlists = pathname.startsWith("/wishlists");

  const baseBtn =
    "inline-flex items-center shrink-0 whitespace-nowrap rounded-xl " +
    "border border-white/60 bg-white/70 px-3 py-2 text-sm " +
    "text-slate-700 shadow-sm transition-colors " +
    "hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500";

  const iconBtn =
    "inline-flex items-center justify-center rounded-xl border border-white/60 " +
    "bg-white/70 p-2 text-slate-700 shadow-sm transition-colors " +
    "hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500";

  return (
    <nav className={`flex flex-nowrap items-center gap-2 ${className}`}>
      {/* ホーム */}
      <Link
        href="/"
        aria-label="ホーム"
        aria-current={pathname === "/" ? "page" : undefined}
        className={`md:hidden ${iconBtn}`}
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path d="M12 3 3 10h2v8h5v-5h4v5h5v-8h2L12 3z" fill="currentColor" />
        </svg>
      </Link>
      <Link
        href="/"
        aria-current={pathname === "/" ? "page" : undefined}
        className={`hidden md:inline-flex ${baseBtn}`}
        data-active={pathname === "/"}
      >
        🏠 ホーム
      </Link>

      {/* Wishlists 一覧 */}
      <Link
        href="/wishlists"
        aria-current={onWishlists && pathname === "/wishlists" ? "page" : undefined}
        className={`hidden md:inline-flex ${baseBtn}`}
        data-active={onWishlists && pathname === "/wishlists"}
      >
        📌 Wishlists
      </Link>

      {/* マップ */}
      <Link
        href="/wishlists/map"
        aria-label="マップで見る"
        aria-current={pathname === "/wishlists/map" ? "page" : undefined}
        className={`md:hidden ${iconBtn}`}
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path d="M12 22s7-5.33 7-12a7 7 0 1 0-14 0c0 6.67 7 12 7 12Zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" fill="currentColor" />
        </svg>
      </Link>
      <Link
        href="/wishlists/map"
        aria-current={pathname === "/wishlists/map" ? "page" : undefined}
        className={`hidden md:inline-flex ${baseBtn} ${pathname === "/wishlists/map" ? "ring-2 ring-sky-500" : ""}`}
      >
        🗺️ マップで見る
      </Link>

      {/* Wishlists 追加 */}
      <AddWishlistLink
        aria-label="Wishlistsに追加"
        iconOnly
        className="md:hidden inline-flex items-center justify-center rounded-xl p-2 shrink-0
                   bg-gradient-to-r from-sky-500 to-teal-500 text-white
                   shadow-[0_6px_20px_-6px_rgba(14,165,233,.6)]
                   hover:brightness-110 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-sky-500"
      />
      <AddWishlistLink
        label="Wishlistsに追加"
        className="hidden md:inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold
                   text-white bg-gradient-to-r from-sky-500 to-teal-500 shrink-0
                   shadow-[0_6px_20px_-6px_rgba(14,165,233,.6)]
                   hover:brightness-110 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-sky-500"
      />
    </nav>
  );
}
