"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignOutPage() {
  const { signOut } = useClerk();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/"; // 例: /sign-out?next=/wishlists

  useEffect(() => {
    // ページ入場と同時にサインアウト → 指定先へ遷移
    signOut().finally(() => router.replace(next));
  }, [signOut, next, router]);

  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <p className="text-sm text-gray-600">サインアウトしています…</p>
    </div>
  );
}
