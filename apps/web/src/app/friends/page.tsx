// apps/web/src/app/friends/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import SignedImage from "@/components/SignedImage";

type Row = {
  friendId: string;
  email: string;
  displayName?: string | null;
  avatarKey?: string | null;
};

export default function FriendsPage() {
  const [accepted, setAccepted] = useState<Row[]>([]);
  const [incoming, setIncoming] = useState<Row[]>([]);
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/friends", { cache: "no-store" });
    const json = await res.json();
    setAccepted(json.accepted ?? []);
    setIncoming(json.incoming ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function sendRequest() {
    if (!to || busy) return;
    setBusy(true);
    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    setBusy(false);
    if (!res.ok) alert("送信できませんでした");
    else {
      setTo("");
      load();
    }
  }

  async function accept(friendId: string) {
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/friends/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });
    setBusy(false);
    if (!res.ok) alert("承認できませんでした");
    else load();
  }

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">友だち</h1>
        <span className="text-xs text-slate-500">
          合計 {accepted.length} 人
        </span>
      </header>

      {/* 申請フォーム */}
      <Card>
        <SectionTitle>友だちを追加</SectionTitle>

        <div className="mt-3 grid gap-2 grid-cols-1 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <input
              type="text"
              placeholder="相手のメール or @ハンドル"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              onKeyDown={(e) => e.key === "Enter" && !busy && to && sendRequest()}
            />
            {/* 右端の軽いヒント */}
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden text-[10px] text-slate-400 sm:block">
              Enter
            </kbd>
          </div>

          <button
            onClick={sendRequest}
            disabled={busy || !to}
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "送信中…" : "申請する"}
          </button>
        </div>
      </Card>

      {/* 承認待ち */}
      <Card>
        <SectionTitle>承認待ち</SectionTitle>

        {incoming.length === 0 ? (
          <Empty>未承認の申請はありません。</Empty>
        ) : (
          <ul className="mt-3 space-y-2">
            {incoming.map((u) => (
              <li
                key={u.friendId}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 overflow-hidden"
              >
                <UserCell row={u} />

                <button
                  onClick={() => accept(u.friendId)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  承認
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 友だち一覧 */}
      <Card>
        <SectionTitle>友だち一覧</SectionTitle>

        {accepted.length === 0 ? (
          <Empty>友だちはまだいません。</Empty>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {accepted.map((u) => (
              <li
                key={u.friendId}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 overflow-hidden"
              >
                <UserCell row={u} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}

/* ---------- UI 小物（依存追加なし） ---------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
      <div className="p-4">{children}</div>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold">{children}</h2>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
      {children}
    </div>
  );
}

function UserCell({ row }: { row: Row }) {
  const name = row.displayName ?? row.email;
  const initials = useInitials(name);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="size-10 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
        {row.avatarKey ? (
          <SignedImage
            objectKey={row.avatarKey}
            alt=""
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">
            {initials}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate font-medium">{name}</div>
        <div className="truncate text-xs text-slate-500">{row.email}</div>
      </div>
    </div>
  );
}

function useInitials(nameOrEmail: string) {
  // displayName or email から 1〜2文字のイニシャルを生成
  return useMemo(() => {
    const base = nameOrEmail.includes("@")
      ? nameOrEmail.split("@")[0]
      : nameOrEmail;
    const parts = base.replace(/[^a-zA-Z0-9ぁ-んァ-ヶ一-龥]/g, " ").trim().split(/\s+/);
    if (parts.length === 0) return "👤";
    const a = parts[0].charAt(0);
    const b = parts.length > 1 ? parts[1].charAt(0) : "";
    return (a + b).toUpperCase();
  }, [nameOrEmail]);
}
