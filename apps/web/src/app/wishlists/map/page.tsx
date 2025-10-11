"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

type Item = {
  placeId: string;
  name: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  imageKey?: string | null;
  photoRef?: string | null;
};
type ApiResp = { items: (Item & { id: string })[] };

const placePhotoUrl = (ref: string | null) =>
  ref
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : "";

async function getSignedUrlFromKey(key?: string | null) {
  if (!key) return null;
  try {
    const r = await fetch(`/api/images/sign-url?key=${encodeURIComponent(key)}`, { cache: "no-store" });
    if (!r.ok) return null;
    const j = (await r.json()) as { url: string };
    return j.url ?? null;
  } catch {
    return null;
  }
}

function escapeHtml(s?: string | null) {
  if (!s) return "";
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function WishlistsMapPage() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [ready, setReady] = useState(false);
  const mapObjRef = useRef<google.maps.Map | null>(null);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const myLocRef = useRef<{ marker: google.maps.Marker | null; accuracy: google.maps.Circle | null }>({
    marker: null,
    accuracy: null,
  });

  // 可変ヘッダー分のパディングを地図に反映（ノッチも考慮）
  const applyMapPadding = useCallback(() => {
  const map = mapObjRef.current;
  if (!map || !headerRef.current) return;

  const headerH = headerRef.current.getBoundingClientRect().height;
  const safeTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sat")) || 0;
  const safeBottom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sab")) || 0;

  const padding: google.maps.Padding = {
    top: Math.round(headerH + safeTop + 8),
    left: 8,
    right: 8,
    bottom: Math.round(safeBottom + 12),
  };

  // ❌ map.setPadding({...})
  // ✅ こちらを使う
  map.setOptions({ padding });
}, []);

  // 1) データ取得
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/wishlists", { cache: "no-store" });
      const j: ApiResp = await r.json();
      setItems(
        (j.items ?? []).map((it) => ({
          placeId: it.placeId,
          name: it.name,
          lat: it.lat,
          lng: it.lng,
          address: it.address,
          imageKey: (it as any).imageKey ?? null,
          photoRef: (it as any).photoRef ?? null,
        }))
      );
    })();
  }, []);

  // 2) 地図初期化
  useEffect(() => {
    let cleanup = () => {};
    (async () => {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!key) {
        console.warn("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY が未設定です。");
        return;
      }
      await setOptions({ key, v: "weekly", libraries: ["maps", "marker"] });
      const { Map } = (await importLibrary("maps")) as google.maps.MapsLibrary;
      const { Marker } = (await importLibrary("marker")) as google.maps.MarkerLibrary;

      if (!mapRef.current) return;

      const map = new Map(mapRef.current, {
        center: { lat: 35.681236, lng: 139.767125 }, // 東京駅
        zoom: 5,
        mapId: "WISHLISTS_MAP",
        // スマホ向け調整
        gestureHandling: "greedy",
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        zoomControl: true,
        clickableIcons: true,
        disableDefaultUI: false,
      });
      mapObjRef.current = map;

      infoRef.current = new google.maps.InfoWindow({
        // モバイルで広がりすぎないよう最大幅
        maxWidth: 280,
      });

      // 3) マーカー作成 & クラスタ
      const valid = items.filter((it) => it.lat != null && it.lng != null);
      const bounds = new google.maps.LatLngBounds();
      const ms: google.maps.Marker[] = [];

      for (const it of valid) {
        const m = new Marker({
          position: { lat: it.lat!, lng: it.lng! },
          map,
          title: it.name,
        });

        m.addListener("click", async () => {
          let img: string | null = null;
          if (it.imageKey) img = await getSignedUrlFromKey(it.imageKey);
          if (!img && it.photoRef) img = placePhotoUrl(it.photoRef);

          const html = `
            <div style="max-width:100%;display:block;">
              <div style="font-weight:600;margin-bottom:6px;font-size:14px;line-height:1.3">${escapeHtml(it.name)}</div>
              ${
                img
                  ? `<img src="${img}" alt="${escapeHtml(it.name)}"
                       style="width:100%;height:auto;border-radius:10px;margin-bottom:8px;display:block;" loading="lazy" />`
                  : ""
              }
              ${it.address ? `<div style="font-size:12px;color:#555;line-height:1.4">${escapeHtml(it.address)}</div>` : ""}
              <div style="margin-top:8px;">
                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  it.name
                )}&query_place_id=${encodeURIComponent(it.placeId)}"
                   target="_blank" rel="noreferrer"
                   style="font-size:13px;text-underline-offset:2px;">Googleマップで開く</a>
              </div>
            </div>
          `;
          infoRef.current!.setContent(html);
          infoRef.current!.open({ anchor: m, map });
        });

        bounds.extend(m.getPosition()!);
        ms.push(m);
      }

      if (clustererRef.current) clustererRef.current.clearMarkers();
      clustererRef.current = new MarkerClusterer({ markers: ms, map });
      markersRef.current = ms;

      if (ms.length) {
        map.fitBounds(bounds);
        const once = google.maps.event.addListenerOnce(map, "bounds_changed", () => {
          if ((map.getZoom() ?? 14) > 14) map.setZoom(14);
          applyMapPadding();
        });
        cleanup = () => google.maps.event.removeListener(once);
      } else {
        applyMapPadding();
      }

      setReady(true);
      // 初期・回転・リサイズでパディング再適用
      const ro = new ResizeObserver(() => applyMapPadding());
      if (headerRef.current) ro.observe(headerRef.current);
      const onResize = () => applyMapPadding();
      window.addEventListener("orientationchange", onResize);
      window.addEventListener("resize", onResize);
      cleanup = () => {
        ro.disconnect();
        window.removeEventListener("orientationchange", onResize);
        window.removeEventListener("resize", onResize);
      };
    })();

    return () => cleanup();
  }, [items, applyMapPadding]);

  // 4) 現在地へズーム
  const zoomToCurrentLocation = useCallback(() => {
    const map = mapObjRef.current;
    if (!map || !navigator.geolocation) {
      alert("現在地を取得できませんでした。");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const here = new google.maps.LatLng(latitude, longitude);

        if (myLocRef.current.marker) {
          myLocRef.current.marker.setMap(null);
          myLocRef.current.marker = null;
        }
        if (myLocRef.current.accuracy) {
          myLocRef.current.accuracy.setMap(null);
          myLocRef.current.accuracy = null;
        }

        const m = new google.maps.Marker({
          position: here,
          map,
          title: "現在地",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
          },
        });
        myLocRef.current.marker = m;

        const circle = new google.maps.Circle({
          center: here,
          radius: Math.max(accuracy || 0, 30),
          map,
          fillColor: "#4285F4",
          fillOpacity: 0.15,
          strokeColor: "#4285F4",
          strokeOpacity: 0.3,
          strokeWeight: 1,
        });
        myLocRef.current.accuracy = circle;

        map.panTo(here);
        map.setZoom(14);
      },
      () => alert("現在地を取得できませんでした。位置情報の許可をご確認ください。"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return (
    // svh/dvh フォールバック: まず svh、未対応なら dvh → 最後に 100vh
    <div className="relative" style={{ height: "100svh", minHeight: "100dvh" }}>
      {/* CSS変数でセーフエリアを参照できるようにしておく */}
      <style>{`
        :root {
          --sat: env(safe-area-inset-top, 0px);
          --sab: env(safe-area-inset-bottom, 0px);
          --sal: env(safe-area-inset-left, 0px);
          --sar: env(safe-area-inset-right, 0px);
        }
      `}</style>

      {/* ヘッダー: stickyにして重なり事故を防止 */}
      <div
        ref={headerRef}
        className="sticky top-0 z-10 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px))" }}
      >
        <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
            <button
                onClick={() => history.back()}
                aria-label="戻る"
                className="rounded-lg border px-3 py-2 active:opacity-80"
                style={{ minHeight: 44, minWidth: 44 }}
            >
                ←
            </button>
            </div>
            <button
            onClick={zoomToCurrentLocation}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 active:opacity-80"
            style={{ minHeight: 44, minWidth: 44 }}
            >
            現在地へ
            </button>
        </div>
        </div>

      {/* 地図 */}
      <div ref={mapRef} className="absolute inset-0" style={{ paddingTop: headerRef.current?.offsetHeight ? headerRef.current.offsetHeight : 0 }} />

      {/* 右下の浮遊ボタン（スマホ操作しやすい） */}
      <div
        className="absolute"
        style={{
          right: "calc(12px + var(--sar))",
          bottom: "calc(16px + var(--sab))",
          zIndex: 11,
        }}
      >
        
      </div>

      {!ready && (
        <div className="absolute inset-0 grid place-items-center text-sm text-gray-500">
          地図を読み込み中…
        </div>
      )}
    </div>
  );
}
