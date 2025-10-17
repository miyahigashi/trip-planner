// apps/web/src/app/projects/[id]/members/CurrentMembers.tsx
"use client";

import { useState } from "react";

type Member = {
  id: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

export default function CurrentMembers({
  projectId,
  initialMembers,
}: {
  projectId: string;
  initialMembers: Member[];
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function removeMember(uid: string) {
    if (pendingId) return;
    if (!confirm("このメンバーをプロジェクトから外しますか？")) return;

    setPendingId(uid);
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${uid}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("failed");
      setMembers((xs) => xs.filter((m) => m.id !== uid));
    } catch {
      alert("削除に失敗しました。");
    } finally {
      setPendingId(null);
    }
  }

  if (members.length === 0) {
    return (
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-base font-semibold">現在のメンバー</h2>
        <p className="text-sm text-slate-500">まだメンバーがいません。</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold">現在のメンバー</h2>
      <ul className="space-y-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-xl border px-3 py-2"
          >
            <div className="min-w-0">
              <div className="truncate font-medium">{m.name ?? m.email ?? "ユーザー"}</div>
              {m.email && <div className="truncate text-xs text-slate-500">{m.email}</div>}
            </div>
            <button
              onClick={() => removeMember(m.id)}
              disabled={pendingId === m.id}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {pendingId === m.id ? "削除中…" : "参加取消し"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
