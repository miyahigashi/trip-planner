// apps/web/src/app/projects/[id]/candidates/SelectToggle.tsx
"use client";
import { useTransition } from "react";
import { selectPlace, unselectPlace } from "@/app/(actions)/project-actions";

export default function SelectToggle(
  { projectId, placeId, selected }: { projectId: string; placeId: string; selected: boolean }
) {
  const [pending, start] = useTransition();
  return selected ? (
    <button
      onClick={() => start(() => unselectPlace(projectId, placeId))}
      disabled={pending}
      className="rounded-lg border px-3 py-1.5 text-sm bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
    >
      ✓ 確定済み（解除）
    </button>
  ) : (
    <button
      onClick={() => start(() => selectPlace(projectId, placeId))}
      disabled={pending}
      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
    >
      確定に追加
    </button>
  );
}
