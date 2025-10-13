"use client";

import { SignedIn, SignedOut, SignInButton, UserProfile } from "@clerk/nextjs";

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <SignedOut>
        <div className="rounded-2xl border bg-white p-8 text-center text-slate-700">
          アカウント設定を表示するにはサインインしてください。
          <div className="mt-4">
            <SignInButton mode="modal" fallbackRedirectUrl="/account">
              <button className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">
                サインイン
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="rounded-2xl border bg-white p-3">
          <UserProfile
            routing="hash"
            appearance={{ variables: { colorPrimary: "#0284c7" } }}
          />
        </div>
      </SignedIn>
    </main>
  );
}
