// apps/web/src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

import Providers from "./providers";
import ClientHeader from "./client-header";
import ClientFooter from "./client-footer";
import { ProgressProvider } from "@/components/nav-progress/ProgressContext";
import { ConfirmProvider } from "@/components/Confirm";

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Trip Planner",
  description: "Plan trips and manage wishlists",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${noto.variable} font-sans`}>
      <body className="min-h-dvh text-slate-900 antialiased bg-sky-sand relative">
        {/* 背景グリッド */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-[0.08] bg-map-grid" />

        <Providers>
          <ConfirmProvider>
            {/* ★ ここから進行バーのコンテキスト。Headerより上でOK */}
            <ProgressProvider>
              <ClientHeader />

              {/* 本文 */}
              <main
                className="relative z-10 mx-auto max-w-6xl px-4 pt-2 md:pt-4
                          pb-[calc(56px+env(safe-area-inset-bottom))]"
              >
                <div
                  className="rounded-2xl border border-white/60 bg-white/80 p-3 sm:p-4 shadow-xl
                            backdrop-blur supports-[backdrop-filter]:bg-white/60"
                  style={{ borderImage: "linear-gradient(180deg, rgba(255,255,255,.7), rgba(255,255,255,.35)) 1" }}
                >
                  {children}
                </div>
              </main>

              <ClientFooter />
            </ProgressProvider>
          </ConfirmProvider>
        </Providers>
      </body>
    </html>
  );
}