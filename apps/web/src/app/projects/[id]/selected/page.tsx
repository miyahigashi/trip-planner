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
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : "/placeholder.jpg";

export default async function SelectedPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await fetchProjectSelected(id);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">確定</h1>

        {/* ★ しおりへの導線 */}
        <Link
          href={`/projects/${id}/selections`}
          className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          しおり
        </Link>
      </div>
      <ProjectTabs projectId={id} />

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border bg-white/70 p-8 text-slate-600">
          確定はまだありません。
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <li key={w.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                {w.imageUrl ? (
                  <SignedImage objectKey={w.imageUrl} alt={w.name ?? "スポット"} width={800} height={600} className="h-full w-full object-cover" />
                ) : w.photoRef ? (
                  <Image src={photoUrl(w.photoRef)} alt={w.name ?? "スポット"} width={800} height={600} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-slate-400">No Photo</div>
                )}
              </div>

              <div className="p-3">
                <div className="font-medium line-clamp-1">{w.name}</div>
                <div className="mt-1 text-xs text-slate-500">{w.prefecture}</div>

                {/* 確定解除のみ（候補へ戻すUIは任意） */}
                <div className="mt-3">
                  <SelectToggle projectId={id} placeId={w.placeId} selected={true} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
