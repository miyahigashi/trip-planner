// apps/web/src/app/projects/page.tsx（あなたのファイル名に合わせて）

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import SignedImage from "@/components/SignedImage";
import { db } from "@/db/client";
import {
  users, projects, projectMembers,
  projectSelections, places,
} from "@/db/schema";
import { desc, eq, inArray, asc } from "drizzle-orm";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getInternalUserId(clerkUserId: string) {
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return row[0]?.id ?? null;
}

const photoUrl = (ref?: string | null) =>
  ref
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : "/placeholder.jpg";

export default async function ProjectsIndexPage() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border bg-white p-8 text-center">
          <p className="text-slate-700">サインインしてください。</p>
          <Link href="/sign-in" className="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-white">
            サインイン
          </Link>
        </div>
      </main>
    );
  }

  const me = await getInternalUserId(clerkUserId);
  if (!me) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border bg-white p-8 text-center">ユーザーが見つかりません。</div>
      </main>
    );
  }

  // 自分がメンバーのプロジェクト
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      startDate: projects.startDate,
      endDate: projects.endDate,
      updatedAt: projects.updatedAt,
      ownerId: projects.ownerId,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(eq(projectMembers.userId, me))
    .orderBy(desc(projects.updatedAt));

  // ---- ★ 各プロジェクトの「確定1枚」をまとめて取得 → 先頭をカバーに ----
  const projectIds = rows.map(r => r.id);
  let coverByProject: Record<string, { imageUrl: string | null; photoRef: string | null; name: string | null }> = {};

  if (projectIds.length > 0) {
    const coverRows = await db
      .select({
        projectId: projectSelections.projectId,
        placeId: projectSelections.placeId,
        name: places.name,
        imageUrl: places.imageUrl,
        photoRef: places.photoRef,
        dayIndex: projectSelections.dayIndex,
        orderInDay: projectSelections.orderInDay,
      })
      .from(projectSelections)
      .innerJoin(places, eq(projectSelections.placeId, places.placeId))
      .where(inArray(projectSelections.projectId, projectIds))
      .orderBy(
        asc(projectSelections.projectId),
        asc(projectSelections.dayIndex),
        asc(projectSelections.orderInDay)
      );

    // プロジェクトごとに最初の1件だけ採用
    for (const r of coverRows) {
      if (!coverByProject[r.projectId]) {
        coverByProject[r.projectId] = {
          imageUrl: r.imageUrl ?? null,
          photoRef: r.photoRef ?? null,
          name: r.name ?? null,
        };
      }
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">旅の計画一覧</h1>
        <Link
          href="/projects/new"
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          新規
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center text-slate-600">
          まだプロジェクトがありません。
          <div className="mt-4">
            <Link href="/projects/new" className="rounded-lg bg-sky-600 px-4 py-2 text-white">
              最初の旅を作成
            </Link>
          </div>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => {
            const isPast = p.endDate && p.endDate < today;
            const cover = coverByProject[p.id] ?? null;

            return (
              <li key={p.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                {/* ★ カバー画像（確定の先頭1枚） */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                  {cover?.imageUrl ? (
                    <SignedImage
                      objectKey={cover.imageUrl}
                      alt={cover.name ?? "スポット"}
                      width={1200}
                      height={675}
                      className="h-full w-full object-cover"
                    />
                  ) : cover?.photoRef ? (
                    <Image
                      src={photoUrl(cover.photoRef)}
                      alt={cover.name ?? "スポット"}
                      width={1200}
                      height={675}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-slate-400">No Photo</div>
                  )}
                </div>

                {/* タップでプロジェクトへ */}
                <Link href={`/projects/${p.id}`} className="block p-4 hover:bg-gray-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold line-clamp-2">{p.title}</h2>
                    {isPast ? (
                      <span className="shrink-0 rounded-full border bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
                        終了
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                        進行中
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {p.startDate ?? "未定"} ~ {p.endDate ?? "未定"}
                  </div>
                  {p.description && (
                    <p className="mt-2 line-clamp-3 text-sm text-slate-600">{p.description}</p>
                  )}
                </Link>

                {/* アクション＆更新日時（既存のまま） */}
                <div className="px-4 pb-4">
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link
                      href={`/projects/${p.id}/candidates`}
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-sky-600 text-white text-sm font-semibold shadow-sm transition hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
                    >
                      候補プール
                    </Link>
                    <Link
                      href={`/projects/${p.id}/selections`}
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                    >
                      確定一覧
                    </Link>
                  </div>

                  <div className="mt-3 flex justify-end">
                    {p.updatedAt ? (
                      <time
                        dateTime={new Date(p.updatedAt).toISOString()}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-200"
                        title={new Date(p.updatedAt).toLocaleString("ja-JP", { hour12: false })}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden className="h-3 w-3">
                          <path
                            fill="currentColor"
                            d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2m.75 5h-1.5v6l5 3 .75-1.23-4.25-2.55z"
                          />
                        </svg>
                        更新:
                        {new Date(p.updatedAt).toLocaleString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </time>
                    ) : (
                      <span className="text-[11px] text-slate-400">更新: —</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
