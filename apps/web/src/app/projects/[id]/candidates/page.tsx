// apps/web/src/app/projects/[id]/candidates/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import SignedImage from "@/components/SignedImage";
import CandidateToggle from "./CandidateToggle";
import SelectToggle from "./SelectToggle";
import { fetchProjectCandidatesPool } from "@/lib/project-data";
import BottomBar from './BottomBar';

const photoUrl = (ref?: string | null) =>
  ref
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : "/placeholder.jpg";

export default async function CandidatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const items = await fetchProjectCandidatesPool(id);

  const selectedCount = items.filter((w) => Boolean(w.isSelected)).length;
  const candidateCount = items.filter((w) => Boolean(w.isCandidate)).length;

  return (
    // ▼ フッター高さぶんの下パディングで“常時押せる”＆“被らない”
    <main
      className="mx-auto max-w-6xl p-6"
      style={{
        // 下ナビ高さ + バー高さ(= p-3 + 内部高さ ≒ 64px 目安) + 余白 + セーフエリア
        paddingBottom:
          "calc(var(--bottom-nav-h, 72px) + 64px + 16px + env(safe-area-inset-bottom))",
      }}
    >
      <h1 className="text-2xl font-bold">候補プール</h1>
      <p className="mt-1 text-slate-600 text-sm">
        プロジェクトID: <code className="text-xs">{id}</code>
      </p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border bg-white/70 p-8 text-slate-600">
          該当データがありません。
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <li
              key={w.id}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                {w.imageUrl ? (
                  <SignedImage
                    objectKey={w.imageUrl}
                    alt={w.name ?? "スポット"}
                    width={800}
                    height={600}
                    className="h-full w-full object-cover"
                  />
                ) : w.photoRef ? (
                  <Image
                    src={photoUrl(w.photoRef)}
                    alt={w.name ?? "スポット"}
                    width={800}
                    height={600}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-slate-400">
                    No Photo
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="font-medium line-clamp-1">{w.name}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {w.prefecture}
                </div>

                {/* 状態バッジ */}
                <div className="mt-2 flex gap-2">
                  {Boolean(w.isCandidate) && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                      候補
                    </span>
                  )}
                  {Boolean(w.isSelected) && (
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                      確定
                    </span>
                  )}
                </div>

                {/* アクション（候補/確定） */}
                <div className="mt-3 flex gap-2">
                  <CandidateToggle
                    projectId={id}
                    placeId={w.placeId}
                    initial={Boolean(w.isCandidate)}
                  />
                  <SelectToggle
                    projectId={id}
                    placeId={w.placeId}
                    selected={Boolean(w.isSelected)}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ▼ 画面下に“常時”固定。カウントも常時見える */}
      <BottomBar
        projectId={id}
        candidateCount={candidateCount}
        selectedCount={selectedCount}
      />
    </main>
  );
}
