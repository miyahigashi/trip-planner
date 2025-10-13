// apps/web/src/app/projects/[id]/members/FriendPicker.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import SignedImage from "@/components/SignedImage";

type FriendRow = {
  friendId: string;
  email: string;
  displayName?: string | null;
  avatarKey?: string | null;
};

export default function FriendPicker({ projectId }: { projectId: string }) {
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // 初回ロード
  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/friends", { cache: "no-store" });
      const json = await res.json();
      setFriends(json.accepted ?? []);
      setLoading(false);
    })();
  }, []);

  // フィルタ済み一覧
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => {
      const name = (f.displayName ?? "").toLowerCase();
      return name.includes(q) || f.email.toLowerCase().includes(q);
    });
  }, [friends, query]);

  const allIds = useMemo(() => filtered.map((f) => f.friendId), [filtered]);
  const allSelectedInFiltered = useMemo(
    () => allIds.length > 0 && allIds.every((id) => selected.has(id)),
    [allIds, selected]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const n = new Set(prev);
      if (allSelectedInFiltered) {
        // いま表示中の分だけ外す
        allIds.forEach((id) => n.delete(id));
      } else {
        // いま表示中の分だけ追加
        allIds.forEach((id) => n.add(id));
      }
      return n;
    });
  }

  async function addSelected() {
    if (selected.size === 0 || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      setSelected(new Set());
      setMessage(`追加しました：${json.added ?? 0}人`);
    } catch {
      setMessage("追加に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  // --- UI ---
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
      {/* 内側に p を移動して、子の影/丸みがカード外へ出ないようにする */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">友だちから追加</h2>
          {message && (
            <span className="text-xs text-slate-500">{message}</span>
          )}
        </div>

        {/* 検索 */}
        <div className="relative">
          <input
            aria-label="友だちを検索"
            placeholder="名前・メールで検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </div>

        {/* 操作バー */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={toggleAll}
            disabled={filtered.length === 0}
            className="text-xs text-slate-600 underline-offset-2 hover:underline disabled:text-slate-300"
          >
            {allSelectedInFiltered ? "表示中をすべて外す" : "表示中をすべて選択"}
          </button>

          <button
            type="button"
            onClick={addSelected}
            disabled={busy || selected.size === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
            ) : null}
            追加する
            {selected.size > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                {selected.size}
              </span>
            )}
          </button>
        </div>

        {/* リスト */}
        <div className="mt-1">
          {/* loading/empty 分岐はそのまま */}
          <ul className="grid gap-2 sm:grid-cols-2">
            {filtered.map((u) => (
              <li key={u.friendId} className="overflow-hidden"> {/* ← 追加 */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-sky-600 shrink-0"
                    checked={selected.has(u.friendId)}
                    onChange={() => toggle(u.friendId)}
                  />
                  <UserCell row={u} />
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------- 小物 ------- */

function UserCell({ row }: { row: FriendRow }) {
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
  return useMemo(() => {
    const base = nameOrEmail.includes("@")
      ? nameOrEmail.split("@")[0]
      : nameOrEmail;
    const parts = base
      .replace(/[^a-zA-Z0-9ぁ-んァ-ヶ一-龥]/g, " ")
      .trim()
      .split(/\s+/);
    if (parts.length === 0) return "👤";
    const a = parts[0].charAt(0);
    const b = parts.length > 1 ? parts[1].charAt(0) : "";
    return (a + b).toUpperCase();
  }, [nameOrEmail]);
}

function SkeletonList() {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
        >
          <div className="size-10 animate-pulse rounded-full bg-slate-200" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-2 w-1/2 animate-pulse rounded bg-slate-200" />
          </div>
        </li>
      ))}
    </ul>
  );
}
