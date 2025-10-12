"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AddWishlistLink from "@/components/AddWishlistLink";

export default function HeaderActions() {
  const pathname = usePathname();
  const onWishlists = pathname?.startsWith("/wishlists");

  const baseBtn =
    "inline-flex items-center rounded-xl border border-white/60 bg-white/70 " +
    "shadow-sm hover:bg-white transition-colors focus-visible:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-sky-500 shrink-0 whitespace-nowrap";

  return (
    <nav className="flex items-center gap-2 flex-nowrap">
      {/* モバイル：ホーム（アイコンのみ） */}
      <Link href="/" aria-label="ホーム" className={`${baseBtn} p-2 md:hidden`}>
        <svg viewBox="0 0 24 24" className="size-5 text-slate-700" aria-hidden>
          <path d="M12 3 3 10h2v8h5v-5h4v5h5v-8h2L12 3z" fill="currentColor" />
        </svg>
      </Link>

      {/* デスクトップ：ホーム（ラベル） */}
      <Link href="/" className={`${baseBtn} px-3 py-2 text-sm hidden md:inline-flex`}>
        🏠 ホーム
      </Link>

      {/* デスクトップ：Wishlists（ラベル） */}
      <Link href="/wishlists" className={`${baseBtn} px-3 py-2 text-sm hidden md:inline-flex`}>
        📌 Wishlists
      </Link>

      {/* モバイル：マップ（アイコンのみ） */}
      <Link href="/wishlists/map" aria-label="マップで見る" className={`${baseBtn} p-2 md:hidden`}>
        <svg viewBox="0 0 24 24" className="size-5 text-slate-700" aria-hidden>
          <path d="M12 22s7-5.33 7-12a7 7 0 1 0-14 0c0 6.67 7 12 7 12Zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" fill="currentColor" />
        </svg>
      </Link>

      {/* デスクトップ：マップ（ラベル） */}
      <Link
        href="/wishlists/map"
        className={[
          "hidden md:inline-flex px-3 py-2 text-sm",
          baseBtn,
          onWishlists && pathname === "/wishlists/map" ? "ring-2 ring-sky-500" : "",
        ].join(" ")}
      >
        🗺️ マップで見る
      </Link>

      {/* モバイル：Wishlists 追加（アイコン） */}
      <AddWishlistLink
        aria-label="Wishlistsに追加"
        iconOnly
        className="md:hidden inline-flex items-center justify-center rounded-xl p-2 shrink-0
                   bg-gradient-to-r from-sky-500 to-teal-500 text-white
                   shadow-[0_6px_20px_-6px_rgba(14,165,233,.6)]
                   hover:brightness-110 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-sky-500"
      />

      {/* デスクトップ：Wishlists 追加（ラベル） */}
      <AddWishlistLink
        className="hidden md:inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold
                   text-white bg-gradient-to-r from-sky-500 to-teal-500 shrink-0
                   shadow-[0_6px_20px_-6px_rgba(14,165,233,.6)]
                   hover:brightness-110 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-sky-500"
                   label="Wishlistsに追加"
      />
    </nav>
  );
}
