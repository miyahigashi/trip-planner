import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { fetchHomeData } from "../lib/home-data";
import { currentUser } from "@clerk/nextjs/server";

export default async function HomePage() {
  const session = await auth();
  const userId = session?.userId ?? null;
  const data = await fetchHomeData(userId ?? null);

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
              href={userId ? "/trips/new" : "/sign-in"}
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
        <Section title="🧳 続きから" moreHref="/trips">
          {data.trips.length ? (
            <Cards cols="4">
              {data.trips.map((t) => (
                <Link
                  key={t.id}
                  href={`/trips/${t.id}`}
                  className="group overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition"
                >
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    {t.coverPhotoUrl ? (
                      <img
                        src={t.coverPhotoUrl}
                        alt=""
                        className="h-full w-full object-cover group-hover:scale-[1.02] transition"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-slate-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-semibold line-clamp-1">{t.title}</div>
                    <div className="mt-1 text-xs text-sky-700/80">{t.status}</div>
                  </div>
                </Link>
              ))}
            </Cards>
          ) : (
            <Empty
              title={userId ? "まだ旅程がありません" : "サインインして旅をつくろう"}
              hint={userId ? "ウィッシュリストから作成もおすすめ。" : undefined}
              action={{
                href: userId ? "/trips/new" : "/sign-in",
                label: userId ? "最初の旅を作る ✨" : "サインイン",
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
                      <img
                        src={w.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-slate-400">
                        No Photo
                      </div>
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
