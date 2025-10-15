// apps/web/src/components/NavLink.tsx
"use client";
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentProps } from "react";
import { useNavProgress } from "@/components/nav-progress/ProgressContext";

type ActiveMode = "exact" | "prefix" | "segment";

type Props = LinkProps &
  Omit<ComponentProps<"a">, "href"> & {
    showSpinner?: boolean;
    activeClassName?: string;
    baseClassName?: string;
    activeMode?: ActiveMode; // ★ 追加
  };

function hrefToString(href: LinkProps["href"]): string {
  if (typeof href === "string") return href;
  if (href instanceof URL) return href.pathname + href.search + href.hash;
  return (href as { pathname?: string } | null)?.pathname ?? "";
}

function isActivePath(pathname: string, hrefStr: string, mode: ActiveMode) {
  if (mode === "exact") return pathname === hrefStr;
  if (mode === "prefix") return pathname.startsWith(hrefStr);
  // segment: /a なら /a または /a/... のみ（/ab は除外）
  return pathname === hrefStr || pathname.startsWith(hrefStr + "/");
}

export default function NavLink({
  href,
  children,
  showSpinner = true,
  className,
  activeClassName = "ring-2 ring-sky-500",
  baseClassName = "",
  activeMode = "segment",   // ★ デフォルト
  ...rest
}: Props) {
  const { start, pendingHref } = useNavProgress();
  const pathname = usePathname() ?? "/";
  const hrefStr = hrefToString(href);

  const active = isActivePath(pathname, hrefStr, activeMode);
  const pending = pendingHref === hrefStr || pendingHref === "__any__";

  return (
    <Link
      href={href}
      onClick={() => start(hrefStr)}
      className={[
        baseClassName,
        className ?? "",
        active ? activeClassName : "",
        "active:translate-y-[1px] active:shadow-none",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
      {...rest}
    >
      {children}
      {showSpinner && pending && (
        <span
          aria-hidden
          className="ml-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-400/60 border-t-transparent align-middle"
        />
      )}
    </Link>
  );
}
