// apps/web/src/app/projects/[id]/my-wishes/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SignedImage from "@/components/SignedImage";
import ProjectTabs from "../_components/ProjectTabs";
import CandidateToggle from "../candidates/CandidateToggle";
import SelectToggle from "../candidates/SelectToggle";
import { fetchMyWishesForProject } from "@/lib/project-data";
import Link from "next/link";

const photoUrl = (ref?: string | null) =>
  ref
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : "/placeholder.jpg";

type Params = { id: string };

export default async function MyWishesPage({ params }: { params: Promise<Params> }) {
  const { id: projectId } = await params;
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?next=/projects/${projectId}/my-wishes`);

  const items = await fetchMyWishesForProject(projectId, userId);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">自分のリスト</h1>
        <Link
          href={`/projects/${projectId}/selections`}
          className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          しおり
        </Link>
      </div>
      <ProjectTabs projectId={projectId} activeKey="my" />

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border bg-white/70 p-8 text-center text-slate-600">
          対象の都道府県に一致するウィッシュはありません。
          <div className="mt-4">
            <Link
              href={`/projects/${projectId}/selections`}
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
                  <div className="grid h-full w-full place-items-center text-slate-400">
                    No Photo
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="font-medium line-clamp-1">{w.name}</div>
                <div className="mt-1 text-xs text-slate-500">{w.prefecture}</div>

                {/* 状態バッジ */}
                <div className="mt-2 flex gap-2">
                  {w.isCandidate && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                      候補
                    </span>
                  )}
                  {w.isSelected && (
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                      確定
                    </span>
                  )}
                </div>

                {/* アクション：候補／確定 */}
                <div className="mt-3 flex gap-2">
                  <CandidateToggle
                    projectId={projectId}
                    placeId={w.placeId}
                    initial={Boolean(w.isCandidate)}
                  />
                  <SelectToggle
                    projectId={projectId}
                    placeId={w.placeId}
                    selected={Boolean(w.isSelected)}
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
