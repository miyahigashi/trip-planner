// apps/web/src/app/projects/[id]/members/page.tsx
import FriendPicker from "./FriendPicker";
import GuestInviteForm from "./GuestInviteForm";

type Params = { id: string };

export default async function MembersPage(
  { params }: { params: Promise<Params> } // ← Promise で受ける
) {
  const { id: projectId } = await params;          // ← await で展開

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">メンバー追加</h1>
      <p className="text-sm text-gray-600">
        友だちをチェックで追加、またはゲストに招待メールを送信できます。
      </p>

      <FriendPicker projectId={projectId} />
      <GuestInviteForm projectId={projectId} />

      <div className="flex justify-end">
        <a
          href={`/projects/${projectId}/candidates`}
          className="inline-flex h-10 items-center rounded-xl border px-4 text-sm hover:bg-gray-50"
        >
          行き先候補へ進む
        </a>
      </div>
    </main>
  );
}
