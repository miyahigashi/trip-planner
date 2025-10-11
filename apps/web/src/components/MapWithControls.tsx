// apps/web/src/components/MapWithControls.tsx
"use client";

import { useEffect, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

type Props = {
  markers?: { lat: number; lng: number }[];
};

export default function MapWithControls({ markers = [] }: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: google.maps.Map | null = null;
    let controls: HTMLElement[] = [];
    let clusterer: any | null = null;

    (async () => {
      // Maps JS 読み込み
      await setOptions({
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        v: "weekly",
        libraries: ["marker"], // AdvancedMarker 用
      });

      const { Map } = (await importLibrary("maps")) as google.maps.MapsLibrary;

      // 地図生成（とりあえず関東を初期表示）
      map = new Map(mapDivRef.current!, {
        center: { lat: 35.6809591, lng: 139.7673068 },
        zoom: 6,
        mapId: "DEMO_MAP",
      });

      // MarkerClusterer（@googlemaps/markerclusterer）
      // 使っていれば↓を有効化（パッケージ導入済み前提）
      try {
        const { MarkerClusterer } = await import("@googlemaps/markerclusterer");
        const pts = markers.map(
          (p) =>
            new google.maps.Marker({
              position: p,
            })
        );
        clusterer = new MarkerClusterer({ map: map!, markers: pts });
      } catch (_) {
        // 未導入でも地図は動かす
      }

      // ========== 日本全体の境界 ==========
      // SW(沖縄寄り) と NE(南鳥島寄り) をざっくりカバー
      const JAPAN_BOUNDS = new google.maps.LatLngBounds(
        { lat: 24.045, lng: 122.934 }, // 南西
        { lat: 45.557, lng: 153.986 }  // 北東
      );

      // 共通：ボタンを地図コントロールに追加
      const addControl = (label: string, onClick: () => void) => {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.type = "button";
        btn.style.cssText =
          "margin:8px;padding:8px 12px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.2)";
        btn.addEventListener("click", onClick);
        map!.controls[google.maps.ControlPosition.TOP_LEFT].push(btn);
        controls.push(btn);
      };

      // ① 現在地へズーム
      addControl("現在地へ", () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const here = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            map!.panTo(here);
            map!.setZoom(14);
          },
          () => {
            alert("現在地を取得できませんでした。");
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });

      // ② 日本全体表示（fitBounds）
      addControl("日本全体表示", () => {
        map!.fitBounds(JAPAN_BOUNDS, { top: 24, right: 24, bottom: 24, left: 24 });
      });

      // 初期表示で全体を見せたい場合は↓
      // map.fitBounds(JAPAN_BOUNDS, { top: 24, right: 24, bottom: 24, left: 24 });
    })();

    return () => {
      // クリーンアップ
      controls.forEach((c) => c.remove());
      if (clusterer) clusterer.setMap(null);
      map = null;
    };
  }, [markers]);

  return <div ref={mapDivRef} className="h-[70vh] w-full rounded-lg border" />;
}
