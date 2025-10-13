import { SignedIn, SignedOut, SignInButton, SignOutButton } from "@clerk/nextjs";

export default function SignOutMenu() {
  return (
    <>
      <SignedIn>
        <SignOutButton redirectUrl="/">
          <button className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
            サインアウト
          </button>
        </SignOutButton>
      </SignedIn>

      <SignedOut>
        {/* 元の redirectUrl は使えない → fallbackRedirectUrl か forceRedirectUrl を使う */}
        <SignInButton mode="modal" fallbackRedirectUrl="/">
          <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700">
            サインイン
          </button>
        </SignInButton>
      </SignedOut>
    </>
  );
}
