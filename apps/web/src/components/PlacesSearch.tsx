// apps/web/src/components/PlacesSearch.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";


/** 他のコンポーネントからも使えるように型を export */
export type FoundPlace = {
  placeId: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  userRatingsTotal: number | null;
  types: string[] | null;
  /** Google Places から拾えた写真URL（なければ null） */
  imageSrcUrl?: string | null;
  prefecture: string | null;
};

type Props = {
  /** 検索候補から1件選択された時に返す */
  onSelect: (p: FoundPlace) => void;
  /** 初期値（任意） */
  defaultValue?: string;
  /** プレースホルダー（任意） */
  placeholder?: string;
  /** input に追加したいクラス（任意） */
  className?: string;
  onClear?: () => void;
  showClearButton?: boolean;
};

/**
 * Google Places Autocomplete（App Router / Client Component）
 * - 新API: setOptions / importLibrary を利用
 * - fields を最小限に絞って課金/パフォーマンスを最適化
 */
export default function PlacesSearch({
  onSelect,
  defaultValue,
  placeholder = "場所名で検索（例: 東京タワー）",
  className = "w-full rounded-lg border px-3 py-2",
  onClear,
  showClearButton = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hasValue, setHasValue] = useState<boolean>(!!defaultValue);
  

  useEffect(() => {
    let cleanup = () => {};
    let listener: google.maps.MapsEventListener | null = null;

    (async () => {
      try {
        // --- 1) Maps JS のオプション設定（scriptは内部で自動読み込み） ---
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.warn("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY が設定されていません。");
          return;
        }

        await setOptions({
            key: apiKey,       // ✅ 正しいプロパティ名
            v: "weekly",       // ✅ 正しいプロパティ名
            libraries: ["places"],
    });

        // --- 2) Places ライブラリを読み込み（型付き） -------------------
        const { Autocomplete } =
          (await importLibrary("places")) as google.maps.PlacesLibrary;

        const el = inputRef.current;
        if (!el) return;

        // --- 3) Autocomplete を初期化 ----------------------------------
        const ac = new Autocomplete(el, {
          // 必要なフィールドだけ取得
          fields: [
            "place_id",
            "name",
            "formatted_address",
            "geometry.location",
            "types",
            "rating",
            "user_ratings_total",
            "photos",
            "address_components",
          ],
          // 施設に絞る（必要なら変更）
          types: ["establishment"],
        });

        // --- 4) 候補選択時のハンドラ ------------------------------------
        listener = ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (!place || !place.place_id) return;
          console.log("[Autocomplete place]:", place);
          console.log("[address_components]:", (place as any).address_components);

          const lat = place.geometry?.location?.lat() ?? null;
          const lng = place.geometry?.location?.lng() ?? null;
          const photoUrl =
            place.photos?.[0]?.getUrl({ maxWidth: 1200, maxHeight: 1200 }) ??
            null;
          console.log("photo url", photoUrl);

          // 都道府県の抽出
          // Autocomplete の型定義は address_components が optional なので any キャストで吸収
          const comps =
            ((place as any).address_components ??
              []) as google.maps.GeocoderAddressComponent[];
          let prefecture: string | null = null;
          if (Array.isArray(comps) && comps.length) {
            const country = comps.find((c) => c.types.includes("country"));
            // 日本のみ都道府県を採用（任意のガード）
            if (!country || country.short_name === "JP") {
              const adm1 = comps.find((c) =>
                c.types.includes("administrative_area_level_1")
              );
              prefecture = adm1?.long_name ?? null; // 例: "東京都"
            }
          }

          const found: FoundPlace = {
            placeId: place.place_id,
            name: place.name ?? "",
            address: place.formatted_address ?? null,
            lat,
            lng,
            rating: place.rating ?? null,
            // TSの定義名と実値の差を吸収
            userRatingsTotal: (place as any).user_ratings_total ?? null,
            types: (place.types as string[]) ?? null,
            imageSrcUrl: photoUrl,
            prefecture,
          };
          console.log("[extracted prefecture]:", prefecture);
          setHasValue(!!inputRef.current?.value);
          onSelect(found);
        });

        // --- 5) クリーンアップ ------------------------------------------
        cleanup = () => {
          if (listener) {
            google.maps.event.removeListener(listener);
            listener = null;
          }
          // 念のためインスタンス由来のイベントも全解除
          // （ac はスコープ外なので明示的 remove は不要）
        };
      } catch (e) {
        console.error("[PlacesSearch] init failed:", e);
      }
    })();

    return () => cleanup();
  }, [onSelect]);
  
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    setHasValue(!!e.currentTarget.value);
  };

  const handleClear = () => {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    setHasValue(false);
    inputRef.current.focus();
    onClear?.();
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={className}
        onInput={handleInput}
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
      />
      {showClearButton && hasValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2
                     z-10 grid h-8 w-8 place-items-center
                     rounded-full bg-white/95 shadow ring-1 ring-gray-300
                     text-gray-500 hover:bg-gray-50 hover:text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="入力をクリア"
          title="入力をクリア"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
