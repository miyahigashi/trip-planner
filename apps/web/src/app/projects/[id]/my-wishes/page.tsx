export const revalidate = 0;
export const dynamic = "force-dynamic";

import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ProjectTabs from "../_components/ProjectTabs";
import { fetchMyWishesForProject } from "@/lib/project-data";
import Link from "next/link";
import { getOrCreateAppUserId } from "@/lib/getAppUserId";

// ★ 追加
import WishCard from "./WishCard";

type Params = { id: string };

export default async function MyWishesPage({ params }: { params: Promise<Params> }) {
  const { id: projectId } = await params;
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect(`/sign-in?next=/projects/${projectId}/my-wishes`);

  const appUserId = await getOrCreateAppUserId(clerkUserId);
  const items = await fetchMyWishesForProject(projectId, /* wishlist の所有者 */ appUserId);

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">自分のリスト</h1>
          <p className="text-xs text-slate-500">あなたが保存した行きたい場所</p>
        </div>
        <Link
          href={`/projects/${projectId}/selections`}
          className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          しおり
        </Link>
      </div>

      <ProjectTabs projectId={projectId} activeKey="my" />

      {items.length === 0 ? (
        <EmptyState projectId={projectId} />
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <WishCard
              key={w.id}
              projectId={projectId}
              placeId={w.placeId}
              name={w.name}
              prefecture={w.prefecture}
              imageUrl={w.imageUrl}
              photoRef={w.photoRef}
              isCandidate={Boolean(w.isCandidate)}
              isSelected={Boolean(w.isSelected)}
            />
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
      <p className="text-slate-600">対象の都道府県に一致するウィッシュはありません。</p>
      <div className="mt-4 flex justify-center gap-2">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          スポットを探す
        </Link>
        <Link
          href={`/projects/${projectId}/selections`}
          className="inline-flex h-10 items-center rounded-xl border px-4 text-sm hover:bg-gray-50"
        >
          しおり
        </Link>
      </div>
    </div>
  );
}
