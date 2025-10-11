// apps/web/src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import HeaderActions from "@/components/FooterActions";
import "./globals.css";

const noto = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-sans" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",   // iPhoneのノッチ領域まで広げる
  maximumScale: 1,        // （任意）ピンチ拡大を抑えるなら
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Trip Planner",
  description: "Plan trips and manage wishlists",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ja" className={`${noto.variable} font-sans`}>
        <body className="min-h-dvh text-slate-900 antialiased bg-sky-sand relative">
          <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-[0.08] bg-map-grid" />

          <header className="sticky top-0 z-20 border-b border-white/40 bg-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40"
                  style={{ paddingTop: "env(safe-area-inset-top)" }}>
            <div className="mx-auto max-w-6xl px-4">
              <div className="flex h-16 items-center justify-between">
                <Link href="/" className="group flex items-center gap-3 outline-none" aria-label="ホームへ戻る">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br
                                   from-sky-400 to-teal-400 text-white shadow-sm ring-1 ring-white/30
                                   group-focus-visible:ring-2 group-focus-visible:ring-sky-500"
                        aria-hidden>
                    <svg viewBox="0 0 24 24" className="size-5">
                      <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm3.9 6.1-2.1 5.3-5.3 2.1 2.1-5.3 5.3-2.1Z" fill="currentColor"/>
                    </svg>
                  </span>
                  <div className="leading-tight">
                    <div className="text-xl font-bold tracking-tight">Trip Planner</div>
                    <div className="text-xs text-slate-600">旅の計画とウィッシュリスト</div>
                  </div>
                </Link>

                
              </div>
            </div>
            <div className="h-[3px] w-full bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400" />
          </header>

          <main className="relative z-10 mx-auto max-w-6xl px-4 py-5">
            <div className="rounded-2xl border border-white/60 bg-white/80 p-3 sm:p-4 shadow-xl
                            backdrop-blur supports-[backdrop-filter]:bg-white/60"
                 style={{ borderImage: "linear-gradient(180deg, rgba(255,255,255,.7), rgba(255,255,255,.35)) 1" }}>
              {children}
            </div>
          </main>
          {/* 右：クライアント側アクション */}
                <HeaderActions />
        </body>
      </html>
    </ClerkProvider>
  );
}
