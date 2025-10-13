"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

type Props = {
  projectId: string;
  candidateCount: number;
  selectedCount: number;
};

export default function BottomBar({
  projectId,
  candidateCount,
  selectedCount,
}: Props) {
  // Hydration mismatch 回避（クライアントでのみ描画）
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const bar = (
    <div
      // body 直下で最前面・常時固定
      className="pointer-events-none fixed inset-x-0 z-[120]"
      style={{
        // 下ナビの高さ + 余白 + セーフエリアの上に配置
        bottom:
          "calc(var(--bottom-nav-h, 45px) + 12px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-6xl px-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white/90 p-3 shadow-lg backdrop-blur">
          {/* 件数バッジ */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
              候補 {candidateCount}
            </span>
            <span className="inline-flex items-center rounded-full border bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              確定 {selectedCount}
            </span>
          </div>

          {/* アクション */}
          <div className="flex items-center gap-2">
            <Link
              href="/projects"
              className="inline-flex items-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
            >
              戻る：一覧へ
            </Link>

            {selectedCount > 0 ? (
              <Link
                href={`/projects/${projectId}/selections`}
                className="inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
              >
                次へ：確定一覧へ
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex items-center rounded-xl bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 shadow cursor-not-allowed"
                title="まずは候補から確定を選んでください"
              >
                次へ：確定一覧へ
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(bar, document.body);
}
