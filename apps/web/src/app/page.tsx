// apps/web/src/app/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { fetchHomeData } from "../lib/home-data";
import { unstable_noStore as noStore } from 'next/cache';
import Image from "next/image";
import SignedImage from "@/components/SignedImage";

export default async function HomePage() {
  const fmt = (s?: string | null) => (s ?? "未定");
  noStore();
  const session = await auth();
  const userId = session?.userId ?? null;
  const data = await fetchHomeData(userId ?? null);

const photoUrl = (ref?: string | null) =>
  ref
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : "/placeholder.jpg";

  return (
    <main className="min-h-dvh bg-gradient-to-b from-sky-200/60 via-white to-amber-50">
      {/* Hero */}
      <section className="px-4">
        <div className="mx-auto max-w-6xl py-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-sm text-slate-600 shadow-sm backdrop-blur">
            ✈️ 旅のスタートページ
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-800">
            次の旅を、デザインしよう。
          </h1>
          <p className="mt-3 text-slate-600">
            行きたい場所を集めて、あなただけの旅程をつくる。
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={userId ? "/projects/new" : "/sign-in"}   // ← ここを変更
              className="rounded-xl bg-sky-600 text-white px-5 py-3 shadow-lg hover:bg-sky-700"
            >
              ✨ {userId ? "旅を計画する" : "サインインしてはじめる"}
            </Link>
            <Link
              href="/wishlists"
              className="rounded-xl border bg-white px-5 py-3 shadow-sm hover:bg-slate-50"
            >
              📍 ウィッシュリストを見る
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border bg-white px-5 py-3 shadow-sm hover:bg-slate-50"
            >
              🗺️ ダッシュボード（地図）
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 grid gap-10">
        {/* 続きから */}
        <Section title="🗓️ これからの旅" moreHref="/projects">
          {data.upcomingProjects.length ? (
            <Cards cols="3">
              {data.upcomingProjects.map((p) => {
                const isSoon = !!p.startDate; // 必要なら近日バッジなど
                return (
                  <div key={p.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <Link href={`/projects/${p.id}`} className="block p-4 hover:bg-gray-50/60">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-semibold line-clamp-2">{p.title}</div>
                        {isSoon && (
                          <span className="shrink-0 rounded-full border bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                            予定
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {fmt(p.startDate)} ~ {fmt(p.endDate)}
                      </div>
                      {p.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{p.description}</p>
                      )}
                    </Link>
                    <div className="px-4 pb-4">
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {/* 候補プール（情報収集＝Sky） */}
                        <Link
                          href={`/projects/${p.id}/candidates`}
                          className="
                            inline-flex h-10 w-full items-center justify-center
                            rounded-xl bg-sky-600 text-white text-sm font-semibold
                            shadow-sm transition
                            hover:bg-sky-700
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2
                          "
                        >
                          候補プール
                        </Link>

                        {/* 確定一覧（決定＝Indigo） */}
                        <Link
                          href={`/projects/${p.id}/selections`}
                          className="
                            inline-flex h-10 w-full items-center justify-center
                            rounded-xl bg-indigo-600 text-white text-sm font-semibold
                            shadow-sm transition
                            hover:bg-indigo-700
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2
                          "
                        >
                          確定一覧
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Cards>
          ) : (
            <Empty
              title={userId ? "これからの旅はまだありません" : "サインインして旅をつくろう"}
              hint={userId ? "まずはプロジェクトを作成しましょう。" : undefined}
              action={{
                href: userId ? "/projects/new" : "/sign-in",
                label: userId ? "新しい旅を作成 ✨" : "サインイン",
              }}
            />
          )}
        </Section>

        {/* 最近のウィッシュ */}
        <Section title="📍 最近保存したスポット" moreHref="/wishlists">
          {data.wishes.length ? (
            <Cards cols="3">
              {data.wishes.map((w) => (
                <div
                  key={w.id}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    {w.imageUrl ? (
                      <SignedImage
                        objectKey={w.imageUrl}            // ← "images/.../w800.webp"
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
                    <div className="font-medium line-clamp-1">
                      {w.name ?? "スポット"}
                    </div>
                  </div>
                </div>
              ))}
            </Cards>
          ) : (
            <Empty
              title={userId ? "まだ保存したスポットがありません" : "サインインしてスポットを保存"}
              action={{
                href: userId ? "/wishlists/new" : "/sign-in",
                label: userId ? "スポットを追加する" : "サインイン",
              }}
            />
          )}
        </Section>

        {/* あなたへのおすすめ（タグ） */}
        <Section title="🌏 あなたへのおすすめ" moreHref="/search">
          <Cards cols="3">
            {(data.topTags.length ? data.topTags : ["海", "温泉", "カフェ"]).map(
              (label, i) => (
                <Link
                  key={`${label}-${i}`}
                  href={`/search?tag=${encodeURIComponent(label)}`}
                  className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow transition group"
                >
                  <div className="text-lg font-semibold group-hover:translate-x-0.5 transition">
                    #{label}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    このタグのスポットを見る
                  </div>
                </Link>
              )
            )}
          </Cards>
        </Section>
      </section>
    </main>
  );
}

function Section({
  title,
  moreHref,
  children,
}: {
  title: string;
  moreHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
        {moreHref && (
          <Link
            href={moreHref}
            className="text-sky-700 hover:underline text-sm"
          >
            もっと見る
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function Cards({
  cols,
  children,
}: {
  cols: "3" | "4";
  children: React.ReactNode;
}) {
  const cls =
    cols === "4"
      ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";
  return <div className={cls}>{children}</div>;
}

function Empty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl border bg-white p-8 text-center text-slate-600">
      <div className="text-lg font-semibold text-slate-800">{title}</div>
      {hint && <p className="mt-1 text-sm">{hint}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 text-white shadow hover:bg-sky-700"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
