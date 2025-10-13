// apps/web/src/app/client-footer.tsx
"use client";

import dynamic from "next/dynamic";

// FooterActions は SSR なしでクライアント読み込み
const FooterActions = dynamic(() => import("@/components/FooterActions"), { ssr: false });

export default function ClientFooter() {
  return <FooterActions />;
}