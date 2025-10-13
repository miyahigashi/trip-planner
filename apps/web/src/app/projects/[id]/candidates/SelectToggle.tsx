// apps/web/src/app/projects/[id]/candidates/SelectToggle.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useOptimistic } from "react";
import { selectPlace, unselectPlace } from "@/app/(actions)/project-actions";

export default function SelectToggle({
  projectId, placeId, selected,
}: { projectId: string; placeId: string; selected: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // 楽観的にトグル
  const [optimistic, setOptimistic] = useOptimistic(selected);

  async function toggle(next: boolean) {
    setOptimistic(next);
    try {
      if (next) await selectPlace(projectId, placeId);
      else await unselectPlace(projectId, placeId);
    } finally {
      // サーバ側で revalidatePath 済みでも、refresh を入れておくと確実
      router.refresh();
    }
  }

  return optimistic ? (
    <button
      type="button"
      onClick={() => startTransition(() => toggle(false))}
      disabled={pending}
      className="rounded-lg border px-3 py-1.5 text-sm bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
    >
      ✓ 確定済み（解除）
    </button>
  ) : (
    <button
      type="button"
      onClick={() => startTransition(() => toggle(true))}
      disabled={pending}
      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
    >
      確定に追加
    </button>
  );
}
