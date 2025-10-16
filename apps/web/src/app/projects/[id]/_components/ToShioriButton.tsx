// apps/web/src/app/projects/[id]/_components/ToShioriButton.tsx
"use client";

import Link from "next/link";

export default function ToShioriButton({
  projectId,
  className = "",
  variant = "primary", // "primary" | "ghost"
}: {
  projectId: string;
  className?: string;
  variant?: "primary" | "ghost";
}) {
  const base =
    "inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
  const style =
    variant === "primary"
      ? "bg-indigo-600 text-white shadow hover:bg-indigo-700"
      : "border text-slate-700 hover:bg-gray-50";

  return (
    <Link href={`/projects/${projectId}/selections`} className={`${base} ${style} ${className}`}>
      しおりを見る
    </Link>
  );
}
