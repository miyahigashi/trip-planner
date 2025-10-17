// apps/web/src/app/projects/[id]/members/page.tsx
import { fetchProjectMembers } from "@/lib/project-data";
import SignedImage from "@/components/SignedImage"; // ← 追加

type Params = { id: string };
type Member = Awaited<ReturnType<typeof fetchProjectMembers>>[number];

function Initials({ text }: { text?: string | null }) {
  const base = (text ?? "").trim() || "?";
  const initials = base.split(/\s+/).slice(0, 2).map(s => s[0]).join("").toUpperCase();
  return (
    <div className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
      {initials || "?"}
    </div>
  );
}

export default async function MembersPage({ params }: { params: Promise<Params> }) {
  const { id: projectId } = await params;
  const members: Member[] = await fetchProjectMembers(projectId);

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">メンバー</h1>

      <div className="flex justify-end">
        <a
          href={`/projects/${projectId}/members/add`}
          className="inline-flex items-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          ＋ メンバーを追加
        </a>
      </div>

      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 rounded-xl border p-3">
            {/* Avatar */}
            {m.avatarUrl ? (
              <div className="size-9 overflow-hidden rounded-full ring-1 ring-slate-200">
                <SignedImage
                  objectKey={m.avatarUrl ?? ""}
                  alt={m.name ?? m.email ?? "avatar"}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : /* もし fetchProjectMembers で avatarUrl を返すならこちらでも可
            m.avatarUrl ? (
              <img src={m.avatarUrl} alt={m.name ?? m.email ?? "avatar"}
                   className="size-9 rounded-full object-cover ring-1 ring-slate-200" />
            ) : */ (
              <Initials text={m.name ?? m.email} />
            )}

            {/* Text */}
            <div className="min-w-0">
              <div className="truncate font-medium">{m.name ?? m.email ?? "名無しさん"}</div>
              {m.email && <div className="truncate text-xs text-slate-500">{m.email}</div>}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-end">
        <a
          href={`/projects/${projectId}/my-wishes`}
          className="inline-flex h-10 items-center rounded-xl border px-4 text-sm hover:bg-gray-50"
        >
          自分のリストへ
        </a>
      </div>
    </main>
  );
}
