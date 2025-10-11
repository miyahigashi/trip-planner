// apps/web/src/components/AddWishlistLink.tsx
"use client";

import Link from "next/link";
import { ComponentProps, ReactNode } from "react";

type Props = {
  /** アイコンだけ表示（ラベルは sr-only） */
  iconOnly?: boolean;
  /** ラベル。未指定なら "Wishlistsに追加" */
  label?: string;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "children">; // href は内部固定にするなら Omit

function PlusIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M11 4h2v16h-2zM4 11h16v2H4z" fill="currentColor" />
    </svg>
  );
}

export default function AddWishlistLink({
  iconOnly = false,
  label = "Wishlistsに追加",
  className = "",
  ...rest
}: Props) {
  const base =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold " +
    "text-white bg-gradient-to-r from-sky-500 to-teal-500 " +
    "shadow-[0_6px_20px_-6px_rgba(14,165,233,.6)] " +
    "hover:brightness-110 focus-visible:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-sky-500";

  return (
    <Link
      href="/wishlists/new" /* 既存の遷移先に合わせて変更してください */
      className={`${base} ${className}`}
      aria-label={rest["aria-label"] ?? label}
      {...rest}
    >
      <PlusIcon />
      {iconOnly ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </Link>
  );
}
