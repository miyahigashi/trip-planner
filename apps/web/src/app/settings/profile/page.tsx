// apps/web/src/app/settings/profile/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, userProfiles } from "@/db/schema"; // ← 追加
import { eq } from "drizzle-orm";
import { updateProfile } from "./updateProfile.action";
import AvatarUploader from "./AvatarUploader";

export default async function ProfileSettingsPage() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border bg-white p-6 text-center">
          サインインしてください。
        </div>
      </main>
    );
  }

  const row = await db
    .select({
      id: users.id,
      handle: users.handle,
      bio: users.bio,
      avatarKey: users.avatarKey,
      displayName: userProfiles.displayName, // ← 追加
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id)) // ← 追加
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  const me = row[0];

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">プロフィール設定</h1>

      <form action={updateProfile} className="mt-6 space-y-5">
        <input type="hidden" name="clerkUserId" value={clerkUserId} />

        {/* 表示名 */}
        <div>
          <label className="block text-sm font-medium text-slate-700">表示名</label>
          <input
            type="text"
            name="displayName"
            defaultValue={me?.displayName ?? ""}
            placeholder="例) 猫太郎"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            maxLength={50}
          />
          <p className="mt-1 text-xs text-slate-500">
            友だち一覧などで優先的に表示される名前です（空の場合は@ハンドルやメールが表示されます）。
          </p>
        </div>

        {/* ハンドル */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            アカウントID（ハンドル）
          </label>
          <input
            type="text"
            name="handle"
            defaultValue={me?.handle ?? ""}
            placeholder="例) neko_taro"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            required
            minLength={3}
            maxLength={20}
            pattern="^[A-Za-z0-9_]{3,20}$"
            title="英数字・アンダースコアのみ、3〜20文字"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <p className="mt-1 text-xs text-slate-500">
            英数字・アンダースコアのみ、3〜20文字。重複不可（大文字小文字は区別しません）
          </p>
        </div>

        {/* 紹介文 */}
        <div>
          <label className="block text-sm font-medium text-slate-700">紹介文</label>
          <textarea
            name="bio"
            defaultValue={me?.bio ?? ""}
            rows={4}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </div>

        {/* アイコン */}
        <div>
          <label className="block text-sm font-medium text-slate-700">プロフィール画像</label>
          <div className="mt-2">
            <AvatarUploader defaultKey={me?.avatarKey ?? null} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <a
            href="/profile"
            className="inline-flex h-10 items-center rounded-xl border px-4 text-sm hover:bg-gray-50"
          >
            キャンセル
          </a>
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow hover:bg-emerald-700"
          >
            保存
          </button>
        </div>
      </form>
    </main>
  );
}
