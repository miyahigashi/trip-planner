"use client";

import { SignedIn, SignedOut, SignInButton, SignOutButton } from "@clerk/nextjs";

export default function AuthMenu() {
  return (
    <div className="flex items-center gap-2">
      {/* サインアウト（サインイン済みの時だけ表示） */}
      <SignedIn>
        <SignOutButton redirectUrl="/">
          <button
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            aria-label="サインアウト"
          >
            サインアウト
          </button>
        </SignOutButton>
      </SignedIn>

      {/* サインイン（未サインインの時だけ表示） */}
      <SignedOut>
        {/* redirectUrl は使えないので fallbackRedirectUrl / forceRedirectUrl を使用 */}
        <SignInButton mode="modal" fallbackRedirectUrl="/">
          <button
            className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            aria-label="サインイン"
          >
            サインイン
          </button>
        </SignInButton>
      </SignedOut>
    </div>
  );
}
