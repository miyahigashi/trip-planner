// apps/web/src/components/NavLink.tsx
"use client";
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentProps } from "react";
import { useNavProgress } from "@/components/nav-progress/ProgressContext";

type Props = LinkProps &
  Omit<ComponentProps<"a">, "href"> & {
    showSpinner?: boolean;
    activeClassName?: string;
    baseClassName?: string;
  };

// href を安全に文字列化
function hrefToString(href: LinkProps["href"]): string {
  if (typeof href === "string") return href;
  // Next の Link は URL も受け取れる
  if (href instanceof URL) return href.pathname + href.search + href.hash;
  // UrlObject 的なパターン
  const obj = href as { pathname?: string; hash?: string; query?: unknown } | null;
  return obj?.pathname ?? "";
}

export default function NavLink({
  href,
  children,
  showSpinner = true,
  className,
  activeClassName = "ring-2 ring-sky-500",
  baseClassName = "",
  ...rest
}: Props) {
  const { start, pendingHref } = useNavProgress();
  const pathname = usePathname() ?? "/";
  const hrefStr = hrefToString(href);

  const isActive =
    pathname === hrefStr || (hrefStr !== "/" && pathname.startsWith(hrefStr));

  const isPending = pendingHref === hrefStr || pendingHref === "__any__";

  return (
    <Link
      href={href}
      onClick={() => start(hrefStr)}
      className={[
        baseClassName,
        className ?? "",
        isActive ? activeClassName : "",
        "active:translate-y-[1px] active:shadow-none",
      ].join(" ")}
      {...rest}
    >
      {children}
      {showSpinner && isPending && (
        <span
          aria-hidden
          className="ml-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-400/60 border-t-transparent align-middle"
        />
      )}
    </Link>
  );
}
