export const revalidate = 0;
export const dynamic = "force-dynamic";

import Image from "next/image";
import SignedImage from "@/components/SignedImage";
import { fetchSelections, fetchProjectMeta } from "@/lib/project-data";
import SelectionsBoard from "./SelectionsBoard";
import Link from "next/link";
import EditProjectButton from "./EditProjectButton";

const photoUrl = (ref?: string | null) =>
  ref
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : "/placeholder.jpg";

export default async function SelectionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rows = await fetchSelections(id);
  const meta = await fetchProjectMeta(id);

  // dayIndex ごとにグループ化
  const days = new Map<number, typeof rows>();
  for (const r of rows) {
    const d = r.dayIndex ?? 0;
    if (!days.has(d)) days.set(d, []);
    days.get(d)!.push(r);
  }

  // 空でも Day0 は作る
  if (!days.size) days.set(0, []);

  // 安定した昇順
  const dayOrder = [...days.keys()].sort((a, b) => a - b);

  return (
    <main className="mx-auto max-w-6xl p-6">
        <div className="mb-4 flex items-center justify-between">
            <Link
            href={`/projects/${id}/candidates`}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
            ← 候補プールへ戻る
            </Link>
            <EditProjectButton
              projectId={id}
              initialTitle={meta?.title ?? ""}
              initialDescription={meta?.description ?? ""}
              initialStartDate={meta?.startDate ?? ""}
              initialEndDate={meta?.endDate ?? ""}
            />
            {/* 右側に補助情報を置きたい場合（例：選択件数） */}
            {/* <span className="text-xs text-slate-500">選択件数: {selections.length}</span> */}
        </div>
      <h1 className="text-2xl font-bold">確定プラン</h1>
      <p className="mt-1 text-slate-600 text-sm">
        プロジェクトID: <code className="text-xs">{id}</code>
      </p>

      <SelectionsBoard projectId={id} initialDays={dayOrder.map((d) => ({
        dayIndex: d,
        items: (days.get(d) ?? []).map((it) => ({
          placeId: it.placeId,
          name: it.name,
          prefecture: it.prefecture,
          imageUrl: it.imageUrl,
          photoRef: it.photoRef,
        })),
      }))} />
    </main>
  );
}
