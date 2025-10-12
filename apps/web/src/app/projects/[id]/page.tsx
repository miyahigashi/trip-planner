// apps/web/src/app/projects/[id]/page.tsx
import { redirect } from "next/navigation";

type Params = { id: string };

export default async function ProjectOverview({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;                 // ← ここがポイント
  redirect(`/projects/${id}/candidates`);
}
