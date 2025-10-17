// apps/web/src/app/projects/[id]/members/add/page.tsxexport const revalidate = 0;
export const dynamic = "force-dynamic";

import Link from "next/link";
import FriendPicker from "../FriendPicker";
import CurrentMembers from "../CurrentMembers";
import { fetchProjectMeta } from "@/lib/project-data";

type Params = { id: string };

type Member = {
  id: string;
  name?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
};

function Avatar({ name, src }: { name?: string | null; src?: string | null }) {
  const initial = (name ?? "?").trim().slice(0, 2);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name ?? "member"}
      className="h-7 w-7 rounded-full object-cover ring-2 ring-white"
    />
  ) : (
    <span className="h-7 w-7 rounded-full bg-slate-200 text-slate-600 grid place-items-center text-xs font-semibold ring-2 ring-white">
      {initial}
    </span>
  );
}

export default async function AddMembersPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id: projectId } = await params;

  // タイトルや現在のメンバーを見せたいので meta を取得（なくてもOK）
  const meta = await fetchProjectMeta(projectId);
  const title = meta?.title ?? "無題のプロジェクト";
  const members = (meta?.members ?? []) as Member[];
  const existingMemberIds =
    (meta?.members ?? []).map((m: any) => m.id).filter(Boolean) as string[];

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">メンバーを追加</h1>
        <Link
          href={`/projects/${projectId}/members`}
          className="inline-flex items-center rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          メンバー一覧へ
        </Link>
      </div>
      <p className="text-sm text-slate-600">
        友だちを選択して「追加する」を押すとこのプロジェクトに参加させます。
      </p>

      {/* 参加済み一覧（取消し可） */}
      <CurrentMembers projectId={projectId} initialMembers={members} />
      {/* 友だちから追加（既存の FriendPicker を使用） */}
      <FriendPicker projectId={projectId} initialSelectedIds={existingMemberIds}/>

      {/* 戻る動線 */}
      <div className="flex justify-end">
        <Link
          href={`/projects/${projectId}/candidates`}
          className="inline-flex h-10 items-center rounded-xl border px-4 text-sm hover:bg-gray-50"
        >
          候補リストへ
        </Link>
      </div>
    </main>
  );
}
