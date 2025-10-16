"use client";
import NavLink from "@/components/NavLink";

export default function ProjectTabs({
  projectId,
  activeKey, // "my" | "candidates" | "selected"
}: { projectId: string; activeKey?: "my"|"candidates"|"selected" }) {
  const base = `/projects/${projectId}`;
  const btn = "rounded-xl border px-4 py-2 text-sm";

  return (
    <div className="mt-3 flex gap-2">
      <NavLink href={`${base}/my-wishes`} className={btn} activeMode="exact" aria-current={activeKey==="my" ? "page" : undefined}>
        自分のリスト
      </NavLink>
      <NavLink href={`${base}/candidates`} className={btn} activeMode="prefix" aria-current={activeKey==="candidates" ? "page" : undefined}>
        候補
      </NavLink>
      <NavLink href={`${base}/selected`} className={btn} activeMode="prefix" aria-current={activeKey==="selected" ? "page" : undefined}>
        確定
      </NavLink>
    </div>
  );
}
