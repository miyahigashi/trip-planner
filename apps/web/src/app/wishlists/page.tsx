// apps/web/src/app/wishlists/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import SignedImage from "@/components/SignedImage";
import FloatingFilter from "@/components/FloatingFilter";
import { PREF_TO_REGION } from "@/lib/regions";
import Portal from "@/components/Portal";

type Item = {
  id: string;
  placeId: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  userRatingsTotal: number | null;
  types: string[] | null;
  photoRef: string | null;
  imageKey?: string | null;
  prefecture?: string | null;
  note?: string | null;
};

type Filters = {
  q: string;
  minRating: number;
  withPhoto: boolean;
  type: string;
  region?: string;
  prefectures?: string[];
};

const photoUrl = (ref: string | null) =>
  ref
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : "/placeholder.jpg";

export default function WishlistsPage() {
  // ------------ state ------------
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Item | null>(null);

  const [editTarget, setEditTarget] =
    useState<{ placeId: string; name: string; note: string | null } | null>(
      null
    );

  // Undo 用
  const [lastDeleted, setLastDeleted] =
    useState<{ placeId: string; item: Item } | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const snapshotRef = useRef<Item[] | null>(null);

  const [filters, setFilters] = useState<Filters>({
    q: "",
    minRating: 0,
    withPhoto: false,
    type: "",
    region: undefined,
    prefectures: undefined,
  });
  const [isFilterOpen, setFilterOpen] = useState(false);

  // ------------- derived -------------
  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) (it.types ?? []).forEach((t) => set.add(t));
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return items.filter((it) => {
      if (q) {
        const hay = `${it.name} ${it.address ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.minRating > 0 && (it.rating ?? 0) < filters.minRating)
        return false;
      if (filters.withPhoto && !(it.imageKey || it.photoRef)) return false;
      if (filters.type && !(it.types ?? []).includes(filters.type)) return false;

      if (filters.region) {
        const r = it.prefecture ? PREF_TO_REGION[it.prefecture] : undefined;
        if (r !== filters.region) return false;
      }
      if (filters.prefectures && filters.prefectures.length > 0) {
        if (!it.prefecture || !filters.prefectures.includes(it.prefecture))
          return false;
      }
      return true;
    });
  }, [items, filters]);

  // region/pref 以外の条件だけ適用した集合（件数母集団）
  const baseFiltered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return items.filter((it) => {
      if (q) {
        const hay = `${it.name} ${it.address ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.minRating > 0 && (it.rating ?? 0) < filters.minRating)
        return false;
      if (filters.withPhoto && !(it.imageKey || it.photoRef)) return false;
      if (filters.type && !(it.types ?? []).includes(filters.type)) return false;
      return true;
    });
  }, [items, filters.q, filters.minRating, filters.withPhoto, filters.type]);

  const regionCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of baseFiltered) {
      const r = it.prefecture ? PREF_TO_REGION[it.prefecture] : undefined;
      if (r) m[r] = (m[r] ?? 0) + 1;
    }
    return m;
  }, [baseFiltered]);

  const prefectureCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of baseFiltered) {
      const p = it.prefecture;
      if (p) m[p] = (m[p] ?? 0) + 1;
    }
    return m;
  }, [baseFiltered]);

  const activeCount =
    (filters.q ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.withPhoto ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.region ? 1 : 0) +
    ((filters.prefectures?.length ?? 0) > 0 ? 1 : 0);

  // ------------- effects -------------
  // 迷子の overlay root 清掃 + body 固定解除
  useEffect(() => {
    document.querySelectorAll<HTMLElement>(".app-overlay-root").forEach((n) => {
      if (!n.firstElementChild) n.remove();
    });
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
  }, []);

  // 一覧取得
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/wishlists", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, [load]);

  // ✅ モーダル系のスクロールロックを 1 本に統合
  useEffect(() => {
    const hasModal = !!confirmTarget || !!editTarget || !!isFilterOpen;
    const prev = document.body.style.overflow;
    if (hasModal) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [confirmTarget, editTarget, isFilterOpen]);

  // ------------- actions -------------
  const onDelete = useCallback(
    async (placeId: string) => {
      setDeletingId(placeId);

      snapshotRef.current = items;
      const removed = items.find((i) => i.placeId === placeId) ?? null;

      setItems((prev) => prev.filter((i) => i.placeId !== placeId));

      if (removed) {
        setLastDeleted({ placeId, item: removed });
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = setTimeout(() => setLastDeleted(null), 6000);
      }

      const res = await fetch(`/api/wishlists/${placeId}`, {
        method: "DELETE",
        credentials: "include",
      });

      setDeletingId(null);

      if (!res.ok && res.status !== 404) {
        if (snapshotRef.current) setItems(snapshotRef.current);
        setLastDeleted(null);
        alert(res.status === 401 ? "ログインが切れました" : "削除に失敗しました");
      }
    },
    [items]
  );

  // ------------- render -------------
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <ul className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <li key={i} className="animate-pulse rounded-2xl border shadow-sm">
              <div className="aspect-[16/9] w-full rounded-t-2xl bg-gray-200" />
              <div className="p-4">
                <div className="h-4 w-2/3 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="px-4 pt-2 pb-6">
      <div className="mx-auto max-w-7xl py-2">
        <div className="flex justify-end">
          <FloatingFilter
            activeCount={activeCount}
            isOpen={isFilterOpen}
            setOpen={setFilterOpen}
            filters={filters}
            setFilters={setFilters}
            typeOptions={typeOptions}
            resultCount={filteredItems.length}
            className="top-[calc(env(safe-area-inset-top)+76px)] right-6 !bottom-auto"
            regionCounts={regionCounts}
            prefectureCounts={prefectureCounts}
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border p-8 text-sm text-gray-600 bg-white/70">
          <div className="mb-2 text-base font-medium text-gray-800">まだお気に入りはありません</div>
          右上の<strong className="font-semibold">「絞り込み」</strong>や
          <strong className="font-semibold">「Wishlists に追加」</strong>から登録してください。
        </div>
      ) : (
        <ul className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((p) => (
          <li
            key={p.id}
            className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md focus-within:shadow-md"
          >
            {/* 画像 */}
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              {p.imageKey ? (
                <SignedImage
                  objectKey={p.imageKey}
                  alt={p.name}
                  width={800}
                  height={450}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              ) : p.photoRef ? (
                <Image
                  src={photoUrl(p.photoRef)}
                  alt={p.name}
                  width={800}
                  height={450}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="h-full w-full bg-gray-100" />
              )}
            </div>

            {/* 本文 */}
            <div className="p-4">
              <div className="mb-1 line-clamp-2 text-[15px] font-semibold text-gray-900">
                {p.name}
              </div>

              {p.address && (
                <div className="line-clamp-2 text-[13px] leading-5 text-gray-600">
                  {p.address}
                </div>
              )}

              {(p.rating != null || p.userRatingsTotal != null) && (
                <div className="mt-2 flex items-center gap-2">
                  {p.rating != null && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      ⭐ {p.rating.toFixed(1)}
                    </span>
                  )}
                  {p.userRatingsTotal != null && (
                    <span className="text-xs text-gray-500">
                      （{p.userRatingsTotal.toLocaleString()}件）
                    </span>
                  )}
                </div>
              )}

              {p.note && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[13px] text-amber-900">
                  <span className="mr-1">📝</span>
                  <span className="whitespace-pre-wrap break-words">{p.note}</span>
                </div>
              )}

              {/* アクション */}
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setEditTarget({ placeId: p.placeId, name: p.name, note: p.note ?? "" })
                  }
                  aria-label={`${p.name} のメモを編集`}
                  className="inline-flex min-h-9 items-center rounded-lg border px-3 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  編集
                </button>

                <button
                  onClick={() => setConfirmTarget(p)}
                  disabled={deletingId === p.placeId}
                  className="inline-flex min-h-9 items-center rounded-lg border px-3 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  {deletingId === p.placeId ? "削除中…" : "削除"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      )}

      {/* 削除確認モーダル（背景クリック透過を防ぐ） */}
      {confirmTarget && (
        <Portal>
          <div role="dialog" aria-modal="true" className="overlay-interactive fixed inset-0 z-[72]">
            {/* 背景（必ず下） */}
            <button
              type="button"
              className="absolute inset-0 z-0 bg-black/40"
              aria-label="モーダルを閉じる"
              onClick={() => setConfirmTarget(null)}
            />

            {/* 本体（必ず上） */}
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
              <div className="w-[92%] max-w-md rounded-2xl bg-white p-5 shadow-xl"
                  onClick={(e) => e.stopPropagation()}>
                <h3 className="text-base font-semibold">本当に削除しますか？</h3>
                <p className="mt-2 text-sm text-gray-600">「{confirmTarget.name}」を削除します。</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                          onClick={() => setConfirmTarget(null)}>
                    キャンセル
                  </button>
                  <button type="button"
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                          onClick={async () => { await onDelete(confirmTarget.placeId); setConfirmTarget(null); }}
                          disabled={deletingId === confirmTarget.placeId}>
                    {deletingId === confirmTarget.placeId ? "削除中…" : "削除する"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* メモ編集モーダル（外枠は pointer-events: none） */}
      {editTarget && (
        <Portal>
        <div
          role="dialog"
          aria-modal="true"
          className="overlay-interactive fixed inset-0 z-[72]"
        >
          <button
            type="button"
            aria-label="モーダルを閉じる"
            className="pointer-events-auto absolute inset-0 bg-black/40"
            onClick={() => setEditTarget(null)}
          />
          <div className="pointer-events-auto absolute inset-0 flex items-center justify-center p-4">
            <div className="w-[92%] max-w-md rounded-2xl bg-white p-5 shadow-xl">
              <h3 className="text-base font-semibold">メモを編集</h3>
              <p className="mt-1 text-sm text-gray-600">{editTarget.name}</p>

              <label className="mt-3 block space-y-1">
                <span className="text-sm text-gray-600">メモ（空にすると削除）</span>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border px-3 py-2"
                  defaultValue={editTarget.note ?? ""}
                  onChange={(e) =>
                    setEditTarget((et) =>
                      et ? { ...et, note: e.target.value } : et
                    )
                  }
                  placeholder="例）この季節に行きたい / 予約が必要 など"
                />
              </label>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => setEditTarget(null)}
                >
                  キャンセル
                </button>
                <button
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700"
                  onClick={async () => {
                    if (!editTarget) return;
                    const { placeId, note } = editTarget;

                    const prev = items;
                    setItems((list) =>
                      list.map((it) =>
                        it.placeId === placeId
                          ? { ...it, note: note?.trim() ? note : null }
                          : it
                      )
                    );

                    const res = await fetch(`/api/wishlists/${placeId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ note }),
                    });

                    if (!res.ok) {
                      setItems(prev); // rollback
                      const err = await res.json().catch(() => ({}));
                      alert(err?.error ?? "更新に失敗しました");
                      return;
                    }

                    setEditTarget(null);
                  }}
                >
                  保存する
                </button>
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}
