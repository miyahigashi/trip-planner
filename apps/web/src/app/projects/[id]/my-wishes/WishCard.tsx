// apps/web/src/app/projects/[id]/my-wishes/WishCard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import SignedImage from "@/components/SignedImage";
import CandidateToggle from "../candidates/CandidateToggle";
import SelectToggle from "../candidates/SelectToggle";

type Props = {
  projectId: string;
  placeId: string;
  name?: string | null;
  prefecture?: string | null;
  imageUrl?: string | null;
  photoRef?: string | null;
  isCandidate: boolean; // 初期候補状態
  isSelected: boolean;  // 初期確定状態
};

const photoUrl = (ref?: string | null) =>
  ref
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : "/placeholder.jpg";

export default function WishCard({
  projectId,
  placeId,
  name,
  prefecture,
  imageUrl,
  photoRef,
  isCandidate,
  isSelected,
}: Props) {
  // ★ ここで候補状態を一元管理 → 右上/下部のボタンに同じ state を渡す
  const [pressed, setPressed] = useState<boolean>(isCandidate);

  return (
    <li className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
      {/* 画像 + オーバーレイ */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        {imageUrl ? (
          <SignedImage
            objectKey={imageUrl}
            alt={name ?? "スポット"}
            width={1200}
            height={675}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : photoRef ? (
          <Image
            src={photoUrl(photoRef)}
            alt={name ?? "スポット"}
            width={1200}
            height={675}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-400">
            No Photo
          </div>
        )}

        {/* 状態ラベル（左下） */}
        <div className="pointer-events-none absolute left-3 bottom-3 flex gap-2">
          {pressed && (
            <span className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700">
              候補
            </span>
          )}
          {isSelected && (
            <span className="rounded-lg bg-indigo-600/95 px-2.5 py-1 text-xs font-semibold text-white">
              確定
            </span>
          )}
        </div>

        {/* 右上：候補トグル（上と下で state 連動） */}
        <div className="absolute right-3 top-3">
          <CandidateToggle
            projectId={projectId}
            placeId={placeId}
            initial={isCandidate}
            isSelected={isSelected}
            pressed={pressed}
            onPressedChange={setPressed}
            className="rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs shadow hover:bg-white"
            aria-label="候補に追加/解除"
          />
        </div>
      </div>

      {/* 本文 */}
      <div className="p-3 sm:p-4">
        <div className="font-medium leading-snug line-clamp-1">{name}</div>
        <div className="mt-1 text-xs text-slate-500">{prefecture}</div>

        {/* 下部アクション：主=確定 / 副=候補（同じ state を共有） */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* <SelectToggle
            projectId={projectId}
            placeId={placeId}
            selected={isSelected}
            className="w-full"
          /> */}
          <CandidateToggle
            projectId={projectId}
            placeId={placeId}
            initial={isCandidate}
            isSelected={isSelected}
            pressed={pressed}
            onPressedChange={setPressed}
            className="w-full rounded-lg border px-3 text-sm hover:bg-gray-50"
            aria-label="候補に追加/解除"
          />
        </div>
      </div>
    </li>
  );
}
