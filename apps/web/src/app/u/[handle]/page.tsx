// apps/web/src/app/u/[handle]/page.tsx
export const revalidate = 60;
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import SignedImage from "@/components/SignedImage";

export default async function PublicProfilePage({
  params,
}: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;

  const [u] = await db
    .select({
      handle: users.handle,
      bio: users.bio,
      avatarKey: users.avatarKey,
    })
    .from(users)
    .where(eq(users.handle, handle.toLowerCase()))
    .limit(1);

  if (!u) return notFound();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex items-center gap-4">
        <div className="size-24 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
          {u.avatarKey ? (
            <SignedImage
              objectKey={u.avatarKey}
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
        <div>
          <div className="text-xl font-bold">@{u.handle}</div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border bg-white/80 p-4">
        <h2 className="text-sm font-semibold text-slate-700">紹介文</h2>
        <p className="mt-1 whitespace-pre-wrap text-slate-700">
          {u.bio?.trim() ? u.bio : "自己紹介はまだありません。"}
        </p>
      </div>
    </main>
  );
}
