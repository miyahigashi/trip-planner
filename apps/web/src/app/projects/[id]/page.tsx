import { redirect } from "next/navigation";

export default function ProjectOverview({ params }: { params: { id: string } }) {
  // まずは候補プールへ誘導（後で概要ページを作るならここを差し替え）
  redirect(`/projects/${params.id}/candidates`);
}