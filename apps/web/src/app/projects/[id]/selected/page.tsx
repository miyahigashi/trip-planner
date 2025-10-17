// apps/web/src/app/projects/[id]/selected/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import Image from "next/image";
import SignedImage from "@/components/SignedImage";
import SelectToggle from "../candidates/SelectToggle";
import ProjectTabs from "../_components/ProjectTabs";
import { fetchProjectSelected } from "@/lib/project-data";
import Link from "next/link";

const photoUrl = (ref?: string | null) =>
  ref
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : "/placeholder.jpg";

export default async function SelectedPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await fetchProjectSelected(id);

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">確定</h1>
          <p className="text-xs text-slate-500">旅行で行く場所の確定リスト</p>
        </div>
        <Link
          href={`/projects/${id}/selections`}
          className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          しおり
        </Link>
      </div>

      <ProjectTabs projectId={id} activeKey="selected" />

      {items.length === 0 ? (
        <EmptyState projectId={id} />
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <li
              key={w.id}
              className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
            >
              {/* 画像 + オーバーレイ */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                {w.imageUrl ? (
                  <SignedImage
                    objectKey={w.imageUrl}
                    alt={w.name ?? "スポット"}
                    width={1200}
                    height={675}
                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                  />
                ) : w.photoRef ? (
                  <Image
                    src={photoUrl(w.photoRef)}
                    alt={w.name ?? "スポット"}
                    width={1200}
                    height={675}
                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-slate-400">No Photo</div>
                )}

                {/* 状態ラベル（左下） */}
                <div className="pointer-events-none absolute left-3 bottom-3">
                  <span className="rounded-lg bg-indigo-600/95 px-2.5 py-1 text-xs font-semibold text-white">
                    確定
                  </span>
                </div>

                {/* クイックアクション（右上）＝ 解除 */}
                <div className="absolute right-3 top-3">
                  <SelectToggle
                    projectId={id}
                    placeId={w.placeId}
                    selected={true}
                    aria-pressed
                    className="
                      rounded-full px-3 py-1 text-xs font-semibold
                      text-white bg-slate-900/70 hover:bg-slate-900/85
                      shadow-md ring-1 ring-white/40 backdrop-blur
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70
                    "
                    // 確定解除時に候補も外す確認を出したい場合は↓
                    // confirmDemote
                  />
                </div>
              </div>

              {/* 本文 */}
              <div className="p-3 sm:p-4">
                <div className="font-medium leading-snug line-clamp-1">{w.name}</div>
                <div className="mt-1 text-xs text-slate-500">{w.prefecture}</div>

                {/* 下部アクション：確定解除のみ */}
                <div className="mt-3">
                  <SelectToggle
                    projectId={id}
                    placeId={w.placeId}
                    selected={true}
                    className="h-9 rounded-lg px-3 text-sm font-semibold"
                    // confirmDemote
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

/* ---- empty ---- */
function EmptyState({ projectId }: { projectId: string }) {
  return (
    <div className="mt-6 rounded-2xl border bg-white/70 p-10 text-center">
      <p className="text-slate-600">確定はまだありません。</p>
      <div className="mt-4 flex justify-center gap-2">
        <Link
          href={`/projects/${projectId}/candidates`}
          className="inline-flex h-10 items-center rounded-xl border px-4 text-sm hover:bg-gray-50"
        >
          候補を見る
        </Link>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          スポットを探す
        </Link>
      </div>
    </div>
  );
}
