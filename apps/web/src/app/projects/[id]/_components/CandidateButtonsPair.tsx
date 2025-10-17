// apps/web/src/app/projects/[id]/candidates/_components/CandidateButtonsPair.tsx
"use client";

import { useState } from "react";
import CandidateToggle from "../candidates/CandidateToggle";

type Props = {
  projectId: string;
  placeId: string;
  initial: boolean;
  isSelected?: boolean;
  topClassName?: string;
  bottomClassName?: string;
};

export default function CandidateButtonsPair({
  projectId,
  placeId,
  initial,
  isSelected,
  topClassName,
  bottomClassName,
}: Props) {
  const [isCandidate, setIsCandidate] = useState<boolean>(initial);

  return (
    <>
      {/* 右上 */}
      {topClassName && (
        <CandidateToggle
          projectId={projectId}
          placeId={placeId}
          initial={initial}
          isSelected={isSelected}
          pressed={isCandidate}
          onPressedChange={setIsCandidate}
          className={topClassName}
          aria-label="候補に追加/解除"
        />
      )}
      {/* 下部 */}
      {bottomClassName && (
        <CandidateToggle
          projectId={projectId}
          placeId={placeId}
          initial={initial}
          isSelected={isSelected}
          pressed={isCandidate}
          onPressedChange={setIsCandidate}
          className={bottomClassName}
          aria-label="候補に追加/解除"
        />
      )}
    </>
  );
}
