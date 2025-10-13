// apps/web/src/app/profile/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import SignedImage from "@/components/SignedImage";

export default async function MyProfilePage() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border bg-white p-8 text-center">
          <div className="text-slate-700">サインインしてください。</div>
          <Link
            href="/sign-in"
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow hover:bg-sky-700"
          >
            サインイン
          </Link>
        </div>
      </main>
    );
  }

  const [me] = await db
    .select({
      id: users.id,
      handle: users.handle,
      bio: users.bio,
      avatarKey: users.avatarKey,
      email: users.email,
    })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">プロフィール</h1>

      <section className="mt-6 rounded-2xl border bg-white/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="size-24 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
            {me?.avatarKey ? (
              <SignedImage
                objectKey={me.avatarKey}
                alt="avatar"
                width={120}
                height={120}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs text-slate-400">
                No Image
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold">
              {me?.handle ? `@${me.handle}` : "ハンドル未設定"}
            </div>
            <div className="mt-0.5 text-sm text-slate-500 break-all">
              {me?.email}
            </div>
          </div>

          <Link
            href="/settings/profile"
            className="inline-flex h-10 items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow hover:bg-emerald-700 whitespace-nowrap"
          >
            編集
          </Link>
        </div>

        <div className="mt-5">
          <h2 className="text-sm font-semibold text-slate-700">紹介文</h2>
          <p className="mt-1 whitespace-pre-wrap rounded-xl border bg-white/60 p-3 text-sm text-slate-700">
            {me?.bio?.trim() ? me.bio : "自己紹介はまだありません。"}
          </p>
        </div>
      </section>
    </main>
  );
}
