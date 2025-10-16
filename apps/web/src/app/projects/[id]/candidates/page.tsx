// apps/web/src/app/projects/[id]/candidates/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import Link from "next/link"; // ★ 追加
import Image from "next/image";
import SignedImage from "@/components/SignedImage";
import CandidateToggle from "../candidates/CandidateToggle";
import SelectToggle from "./SelectToggle";
import ProjectTabs from "../_components/ProjectTabs";
import { fetchProjectCandidates } from "@/lib/project-data";
import CandidateVoteButton from "./CandidateVoteButton";


const photoUrl = (ref?: string | null) =>
  ref
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : "/placeholder.jpg";

export default async function CandidatesPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await fetchProjectCandidates(id);

  return (
    <main className="mx-auto max-w-6xl p-6">
      {/* タイトル + しおりボタン */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">候補</h1>
        <Link
          href={`/projects/${id}/selections`}
          className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          しおり
        </Link>
      </div>

      <ProjectTabs projectId={id} />

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border bg-white/70 p-8 text-center text-slate-600">
          候補はまだありません。
          <div className="mt-4">
            <Link
              href={`/projects/${id}/selections`}
              className="inline-flex h-10 items-center rounded-xl border px-4 text-sm hover:bg-gray-50"
            >
              しおり
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <li key={w.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
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
                  <div className="grid h-full w-full place-items-center text-slate-400">No Photo</div>
                )}
              </div>

              <div className="p-3">
                <div className="font-medium line-clamp-1">{w.name}</div>
                <div className="mt-1 text-xs text-slate-500">{w.prefecture}</div>

                {/* 候補解除 or 確定へ */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <CandidateToggle
                    projectId={id}
                    placeId={w.placeId}
                    initial={true}
                    isSelected={Boolean(w.isSelected)} // ← 重要
                  />
                  <SelectToggle projectId={id} placeId={w.placeId} selected={Boolean(w.isSelected)} />
                </div>
                <CandidateVoteButton
                  projectId={id}
                  placeId={w.placeId}
                  initialVoted={Boolean(w.votedByMe)}
                  initialCount={Number(w.votes ?? 0)}
                  className="!px-2.5 !py-1.5"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
