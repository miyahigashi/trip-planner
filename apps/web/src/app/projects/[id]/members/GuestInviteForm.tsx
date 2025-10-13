// apps/web/src/app/projects/[id]/members/GuestInviteForm.tsx
"use client";

import { useState } from "react";

export default function GuestInviteForm({ projectId }: { projectId: string }) {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("editor");
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const list = emails.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    if (list.length === 0) return;

    setSending(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emails: list, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "招待に失敗しました");
      alert(`招待メールを送信: ${json.invitesCreated} 通\n既存ユーザーでスキップ: ${json.skippedExisting}`);
      setEmails("");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border p-4 space-y-3">
      <div className="font-medium">ゲストを招待（メール）</div>
      <input
        className="w-full rounded-xl border px-3 py-2 text-sm"
        placeholder="foo@example.com bar@example.com"
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name="role" checked={role === "editor"} onChange={() => setRole("editor")} />
          編集可 (editor)
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="role" checked={role === "viewer"} onChange={() => setRole("viewer")} />
          閲覧のみ (viewer)
        </label>
      </div>
      <div className="flex justify-end">
        <button
            type="submit"
            disabled={sending}
            className="
            inline-flex h-10 items-center justify-center
            rounded-xl bg-emerald-600
            px-5 sm:px-6
            text-sm font-semibold text-white
            whitespace-nowrap
            disabled:opacity-50
            w-full sm:w-auto
            "
        >
            {sending ? "送信中…" : "招待メールを送る"}
        </button>
    </div>
      <p className="text-xs text-gray-500">
        既存ユーザー宛のメールはスキップされます（友だち一覧から追加してください）。
      </p>
    </form>
  );
}
