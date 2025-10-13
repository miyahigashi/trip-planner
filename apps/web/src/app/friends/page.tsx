"use client";

import { useEffect, useState } from "react";
import SignedImage from "@/components/SignedImage";

type Row = { friendId: string; email: string; displayName?: string | null; avatarKey?: string | null };

export default function FriendsPage() {
  const [accepted, setAccepted] = useState<Row[]>([]);
  const [incoming, setIncoming] = useState<Row[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/friends", { cache: "no-store" });
    const json = await res.json();
    setAccepted(json.accepted ?? []);
    setIncoming(json.incoming ?? []);
  }

  useEffect(() => { load(); }, []);

  async function sendRequest() {
    if (!email) return;
    setBusy(true);
    const res = await fetch("/api/friends/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setBusy(false);
    if (!res.ok) alert("送信できませんでした");
    else { setEmail(""); load(); }
  }

  async function accept(friendId: string) {
    setBusy(true);
    const res = await fetch("/api/friends/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ friendId }) });
    setBusy(false);
    if (!res.ok) alert("承認できませんでした");
    else load();
  }

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">
      <h1 className="text-2xl font-bold">友だち</h1>

      {/* 申請フォーム */}
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="text-base font-semibold">友だちを追加</h2>
        <div className="mt-3 flex gap-2">
          <input
            type="email"
            placeholder="相手のメールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-lg border px-3 py-2"
          />
          <button
            onClick={sendRequest}
            disabled={busy || !email}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            申請する
          </button>
        </div>
      </section>

      {/* 承認待ち */}
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="text-base font-semibold">承認待ち</h2>
        {incoming.length === 0 ? (
          <div className="mt-2 text-sm text-slate-500">未承認の申請はありません。</div>
        ) : (
          <ul className="mt-3 space-y-2">
            {incoming.map((u) => (
              <li key={u.friendId} className="flex items-center justify-between rounded-xl border px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="size-9 overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200">
                    {u.avatarKey ? (
                      <SignedImage objectKey={u.avatarKey} alt="" width={80} height={80} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <div className="font-medium">{u.displayName ?? u.email}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>
                </div>
                <button onClick={() => accept(u.friendId)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">
                  承認
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 友だち一覧 */}
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="text-base font-semibold">友だち一覧</h2>
        {accepted.length === 0 ? (
          <div className="mt-2 text-sm text-slate-500">友だちはまだいません。</div>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {accepted.map((u) => (
              <li key={u.friendId} className="flex items-center gap-3 rounded-xl border px-3 py-2">
                <div className="size-10 overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200">
                  {u.avatarKey ? (
                    <SignedImage objectKey={u.avatarKey} alt="" width={100} height={100} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div>
                  <div className="font-medium">{u.displayName ?? u.email}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
