// apps/web/src/app/projects/[id]/plan/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import SignedImage from "@/components/SignedImage";
import { fetchSelections } from "@/lib/project-data";

const photoUrl = (ref?: string | null) =>
  ref
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : "/placeholder.jpg";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // dayIndex, orderInDay の昇順で並んだリスト
  const items = await fetchSelections(id);

  // 型を selections の要素型から推論
  type Sel = Awaited<ReturnType<typeof fetchSelections>>[number];

  // dayIndex ごとにグルーピング
  const byDay = new Map<number, Sel[]>();
  for (const it of items) {
    const day = it.dayIndex ?? 0;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(it);
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold">計画（確定リスト）</h1>
        <Link
          href={`/projects/${id}/candidates`}
          className="text-sky-700 text-sm hover:underline"
        >
          候補プールへ
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border bg-white/70 p-8 text-slate-600">
          まだ確定したスポットがありません。候補プールから「確定に追加」を押してください。
        </div>
      ) : (
        Array.from(byDay.entries()).map(([day, list]) => (
          <section key={day} className="mt-8">
            <h2 className="text-lg font-semibold">Day {day + 1}</h2>
            <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((w, i) => (
                <li
                  key={`${w.placeId}-${i}`}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
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
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
