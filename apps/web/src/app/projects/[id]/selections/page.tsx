// apps/web/src/app/projects/[id]/selections/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  fetchSelections,
  fetchProjectMeta,
  fetchProjectPrefectures,
} from "@/lib/project-data";
import SelectionsBoard from "./SelectionsBoard";
import EditProjectButton from "./EditProjectButton";

// ---- helpers ---------------------------------------------------------------
const photoUrl = (ref?: string | null) =>
  ref
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : "/placeholder.jpg";

function daysInclusive(start?: string | null, end?: string | null): number {
  if (!start || !end) return 1;
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
  const diff = Math.floor((e.getTime() - s.getTime()) / 86_400_000) + 1;
  return Math.max(1, diff);
}

function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(`${d}T00:00:00`);
  if (isNaN(dt.getTime())) return "";
  const m = dt.getMonth() + 1;
  const day = dt.getDate();
  return `${m}/${day}`;
}

// ---- types（fetchProjectMeta が返す想定） ---
type Member = { id: string; name?: string | null; avatarUrl?: string | null };
type ProjectMeta = {
  title?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  prefectures?: string[] | null;
  members?: Member[] | null;
};

// ---------------------------------------------------------------------------
export default async function SelectionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 確定スポット + プロジェクトメタ + 都道府県
  const [rows, metaRaw, prefectures] = await Promise.all([
    fetchSelections(id),
    fetchProjectMeta(id),
    fetchProjectPrefectures(id), // ← これだけ使う（API フェッチは不要）
  ]);
  const meta = (metaRaw ?? {}) as ProjectMeta;

  // dayIndex ごとにグループ化
  const daysMap = new Map<number, typeof rows>();
  for (const r of rows) {
    const d = r.dayIndex ?? 0;
    if (!daysMap.has(d)) daysMap.set(d, []);
    daysMap.get(d)!.push(r);
  }

  // 期間（日数）計算。未設定なら 1 日
  const totalDays = daysInclusive(meta.startDate ?? null, meta.endDate ?? null);

  // 空の日も用意
  for (let i = 0; i < totalDays; i++) if (!daysMap.has(i)) daysMap.set(i, []);
  const dayOrder = Array.from({ length: totalDays }, (_, i) => i);

  // header 用表示文
  const dateText =
    meta.startDate && meta.endDate
      ? `${fmtDate(meta.startDate)} ~ ${fmtDate(meta.endDate)}（${totalDays}日）`
      : undefined;

  const members = (meta.members ?? []) as Member[];

  return (
    <main className="mx-auto max-w-6xl p-6">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/projects/${id}/candidates`}
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          ← 候補
        </Link>
        {/* メンバー管理ボタン */}
        <Link
          href={`/projects/${id}/members`}
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          メンバー管理
        </Link>
        <EditProjectButton
          projectId={id}
          initialTitle={meta?.title ?? ""}
          initialDescription={meta?.description ?? ""}
          initialStartDate={meta?.startDate ?? ""}
          initialEndDate={meta?.endDate ?? ""}
          initialPrefectures={prefectures} 
        />
      </div>

      {/* Project header card */}
      <section
        className="mb-4 rounded-2xl border bg-white/80 p-4 shadow-sm"
        aria-label="プロジェクト情報"
      >
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold leading-tight line-clamp-2">
              {meta.title || "無題のプロジェクト"}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              {dateText && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                  📅 {dateText}
                </span>
              )}
              {prefectures.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                  🗾
                  <span className="flex flex-wrap gap-1">
                    {prefectures.map((p) => (
                      <span
                        key={p}
                        className="rounded-md bg-white/80 px-1.5 py-[2px] text-xs text-slate-700 border"
                      >
                        {p}
                      </span>
                    ))}
                  </span>
                </span>
              )}
            </div>

            {meta.description && (
              <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                {meta.description}
              </p>
            )}
          </div>

          {/* Members */}
          {members.length > 0 && (
            <div className="shrink-0">
              <div className="flex -space-x-2">
                {members.slice(0, 5).map((m) => (
                  <span key={m.id} className="h-7 w-7 rounded-full bg-slate-100 grid place-items-center text-xs text-slate-600 ring-2 ring-white">
                    {/* Avatar 省略（必要なら画像を表示） */}
                    {m.name?.slice(0,2) ?? "?"}
                  </span>
                ))}
                {members.length > 5 && (
                  <span className="h-7 w-7 rounded-full bg-slate-100 grid place-items-center text-xs text-slate-600 ring-2 ring-white">
                    +{members.length - 5}
                  </span>
                )}
              </div>
              <div className="mt-1 text-center text-xs text-slate-500">参加メンバー</div>
            </div>
          )}
        </div>
      </section>

      {/* Selections board */}
      <SelectionsBoard
        projectId={id}
        initialDays={dayOrder.map((d) => ({
          dayIndex: d,
          items: (daysMap.get(d) ?? []).map((it) => ({
            placeId: it.placeId,
            name: it.name,
            prefecture: it.prefecture,
            imageUrl: it.imageUrl,
            photoRef: it.photoRef,
            note: it.note ?? null,
          })),
        }))}
      />
    </main>
  );
}
