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

type Props = {
  projectId: string;
  /** 参加済みユーザーの userId。初期選択かつチェック不可にする */
  initialSelectedIds?: string[];
};

export default function FriendPicker({
  projectId,
  initialSelectedIds = [],
}: Props) {
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  /** 選択状態 */
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelectedIds)
  );
  /** 参加済み(=ロック)集合。チェック不可にする */
  const [locked, setLocked] = useState<Set<string>>(
    () => new Set(initialSelectedIds)
  );

  // 親 props 変化に追随（ナビゲーションで切替え時など）
  useEffect(() => {
    setSelected(new Set(initialSelectedIds));
    setLocked(new Set(initialSelectedIds));
  }, [initialSelectedIds]);

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

  // フィルタ
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => {
      const name = (f.displayName ?? "").toLowerCase();
      return name.includes(q) || f.email.toLowerCase().includes(q);
    });
  }, [friends, query]);

  const allIds = useMemo(() => filtered.map((f) => f.friendId), [filtered]);

  // 表示中すべてが「選択済み or 参加済み」なら true
  const allSelectedInFiltered = useMemo(
    () => allIds.every((id) => selected.has(id) || locked.has(id)),
    [allIds, selected, locked]
  );

  function toggle(id: string) {
    // 参加済みは触らせない
    if (locked.has(id)) return;
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const n = new Set(prev);
      if (allSelectedInFiltered) {
        // 表示中で「参加済みではない」分だけ外す
        allIds.forEach((id) => {
          if (!locked.has(id)) n.delete(id);
        });
      } else {
        // 表示中で「参加済みではない」分だけ選ぶ
        allIds.forEach((id) => {
          if (!locked.has(id)) n.add(id);
        });
      }
      return n;
    });
  }

  async function addSelected() {
    // 追加対象は「選択済み かつ 参加済みではない」
    const payloadIds = Array.from(selected).filter((id) => !locked.has(id));
    if (payloadIds.length === 0 || busy) return;

    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: payloadIds }),
      });
      if (!res.ok) throw new Error("failed");
      const json = await res.json();

      // 成功: 追加した分を locked に取り込み、選択をクリア
      setLocked((prev) => {
        const n = new Set(prev);
        payloadIds.forEach((id) => n.add(id));
        return n;
      });
      setSelected(new Set());
      setMessage(`追加しました：${json.added ?? payloadIds.length}人`);
    } catch {
      setMessage("追加に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  // --- UI ---
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">友だちから追加</h2>
          {message && <span className="text-xs text-slate-500">{message}</span>}
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
            disabled={busy || Array.from(selected).filter((id) => !locked.has(id)).length === 0}
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
          {loading ? (
            <SkeletonList />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {filtered.map((u) => {
                const isLocked = locked.has(u.friendId);
                return (
                  <li key={u.friendId} className="overflow-hidden">
                    <label
                      className={
                        "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 shadow-sm transition " +
                        (isLocked
                          ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                          : "bg-white hover:bg-slate-50")
                      }
                      title={isLocked ? "参加済み" : undefined}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-sky-600 shrink-0"
                        checked={selected.has(u.friendId) || isLocked}
                        disabled={isLocked || busy}
                        onChange={() => toggle(u.friendId)}
                      />
                      <UserCell row={u} />
                      {isLocked && (
                        <span className="ml-auto rounded-full border px-2 py-0.5 text-[11px]">
                          参加済み
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------- 小物（既存のままでOK） ------- */

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
