// apps/web/src/app/projects/[id]/candidates/page.tsx
export const revalidate = 0
export const dynamic = "force-dynamic"

import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { getOrCreateAppUserId } from "@/lib/getAppUserId"
import ProjectTabs from "../_components/ProjectTabs"
import { fetchProjectCandidates } from "@/lib/project-data"
import CandidateCard from "./CandidateCard";

const photoUrl = (ref?: string | null) =>
  ref
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : "/placeholder.jpg"

export default async function CandidatesPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId: clerkUserId } = await auth();
  const appUserId = clerkUserId ? await getOrCreateAppUserId(clerkUserId) : undefined;

  const items = await fetchProjectCandidates(id, appUserId);

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">候補</h1>
          <p className="text-xs text-slate-500">行きたい場所の候補一覧</p>
        </div>
        <Link
          href={`/projects/${id}/selections`}
          className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          しおり
        </Link>
      </div>

      <ProjectTabs projectId={id} />

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border bg-white/70 p-10 text-center text-slate-600">
          候補はまだありません。
          <div className="mt-4">
            <Link
              href={`/projects/${id}`}
              className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              スポットを探す
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <CandidateCard
              key={w.id}
              projectId={id}
              placeId={w.placeId}
              name={w.name}
              prefecture={w.prefecture}
              imageUrl={w.imageUrl}
              photoRef={w.photoRef}
              isSelected={Boolean(w.isSelected)}
              isCandidate={true}                 // 候補一覧なら true
              votes={Number(w.votes ?? 0)}
              votedByMe={Boolean(w.votedByMe)}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
