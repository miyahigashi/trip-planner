// apps/web/src/app/wishlists/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import AddWishlistLink from "@/components/AddWishlistLink";
import SignedImage from "@/components/SignedImage"; // 署名URLで読む場合のコンポーネント
import FloatingFilter from "@/components/FloatingFilter";
import { keyToPublicUrl } from "@/lib/gcs";
import Link from "next/link";
import { REGIONS, PREFECTURES, PREF_TO_REGION } from "@/lib/regions";

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
  photoRef: string | null;       // Google Place Photo の photo_reference
  imageKey?: string | null;      // GCS のオブジェクトキー（例: images/<hash>/w800.webp）
  prefecture?: string | null;
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
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Undo 用
  const [lastDeleted, setLastDeleted] = useState<{ placeId: string; item: Item } | null>(null);
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

  // 種類(type)の候補を items から動的生成
  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) (it.types ?? []).forEach(t => set.add(t));
    return Array.from(set).sort();
  }, [items]);

  // 絞り込み結果
  const filteredItems = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return items.filter(it => {
      if (q) {
        const hay = `${it.name} ${it.address ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.minRating > 0 && (it.rating ?? 0) < filters.minRating) return false;
      if (filters.withPhoto && !(it.imageKey || it.photoRef)) return false;
      if (filters.type && !(it.types ?? []).includes(filters.type)) return false;

      // ★ 地方（region）で絞り込み
      if (filters.region) {
        const r = it.prefecture ? PREF_TO_REGION[it.prefecture] : undefined;
        if (r !== filters.region) return false;
      }

      // ★ 都道府県（複数）
      if (filters.prefectures && filters.prefectures.length > 0) {
        if (!it.prefecture || !filters.prefectures.includes(it.prefecture)) return false;
      }

      return true;
    });
  }, [items, filters]);

  const activeCount =
    (filters.q ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.withPhoto ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.region ? 1 : 0) +
    ((filters.prefectures?.length ?? 0) > 0 ? 1 : 0);

  // モーダルを開いている間は背面スクロール抑止（任意）
  useEffect(() => {
    if (!isFilterOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isFilterOpen]);
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

  const onDelete = useCallback(
    async (placeId: string) => {
      setDeletingId(placeId);

      // 楽観更新のためのスナップショット
      snapshotRef.current = items;
      const removed = items.find((i) => i.placeId === placeId) ?? null;

      // 先にUIから消す
      setItems((prev) => prev.filter((i) => i.placeId !== placeId));

      // Undo 表示
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
        // 404 は既に削除済みなので成功扱い
        // それ以外はロールバック
        if (snapshotRef.current) setItems(snapshotRef.current);
        setLastDeleted(null);
        alert(res.status === 401 ? "ログインが切れました" : "削除に失敗しました");
      }
    },
    [items]
  );

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-3 animate-pulse">
              <div className="mb-3 h-40 w-full rounded-lg bg-gray-200" />
              <div className="h-4 w-2/3 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex justify-end">
          <FloatingFilter
            activeCount={activeCount}
            isOpen={isFilterOpen}
            setOpen={setFilterOpen}
            filters={filters}
            setFilters={setFilters}
            typeOptions={typeOptions}
            resultCount={filteredItems.length}
            className="top-[calc(env(safe-area-inset-top)+80px)] right-6 !bottom-auto"
          />
        </div>
      </div>
      {filteredItems.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-gray-600">
          まだお気に入りはありません。右上の「Wishlistsに追加」から登録してください。
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((p) => (
            <li key={p.id} className="rounded-xl border p-3 shadow-sm">
              {/* 画像：優先順位 = GCS key → Google photoRef → プレースホルダー */}
              {p.imageKey ? (
                // バケットが非公開でも SignedImage が署名URLで描画してくれる想定
                <SignedImage
                  objectKey={p.imageKey}
                  alt={p.name}
                  width={800}
                  height={320}
                  className="mb-3 h-40 w-full rounded-lg object-cover"
                />
              ) : p.photoRef ? (
                <Image
                  src={photoUrl(p.photoRef)}
                  alt={p.name}
                  width={800}
                  height={320}
                  className="mb-3 h-40 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="mb-3 h-40 w-full rounded-lg bg-gray-100" />
              )}

              <div className="font-medium">{p.name}</div>
              {p.address && (
                <div className="text-sm text-gray-600">{p.address}</div>
              )}

              {(p.rating != null || p.userRatingsTotal != null) && (
                <div className="mt-1 text-sm text-gray-700">
                  {p.rating != null && <>⭐ {p.rating}</>}{" "}
                  {p.userRatingsTotal != null && <>（{p.userRatingsTotal}件）</>}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onDelete(p.placeId)}
                  disabled={deletingId === p.placeId}
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  {deletingId === p.placeId ? "削除中…" : "削除"}
                </button>

                {/* 公開バケット（署名不要）の確認用に直接URLが欲しいときはこれを使う */}
                {/* {p.imageKey && (
                  <a
                    className="text-sm text-blue-600 underline"
                    href={keyToPublicUrl(p.imageKey)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    画像を開く
                  </a>
                )} */}
              </div>
            </li>
          ))}
        </ul>
      )}

      {lastDeleted && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border bg-white px-4 py-2 shadow">
          <div className="flex items-center gap-3">
            <span className="text-sm">削除しました: {lastDeleted.item.name}</span>
            <button
              className="text-sm text-blue-600 underline"
              onClick={async () => {
                if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
                undoTimerRef.current = null;

                const p = lastDeleted.item;
                setLastDeleted(null);

                // 直前の1件だけ復活（409=既存時は成功扱い）
                const res = await fetch("/api/wishlists", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    place: {
                      placeId: p.placeId,
                      name: p.name,
                      address: p.address,
                      lat: p.lat,
                      lng: p.lng,
                      rating: p.rating,
                      userRatingsTotal: p.userRatingsTotal,
                      types: p.types,
                      photoRef: p.photoRef,
                      prefecture: p.prefecture,
                      // imageKey は POST 側で imageSrcUrl と排他運用なら省略
                    },
                  }),
                });

                if (!res.ok && res.status !== 409) {
                  alert("元に戻せませんでした");
                }
                load();
              }}
            >
              元に戻す
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}
