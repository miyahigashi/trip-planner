"use client";
import Portal from "./Portal";
import { cn } from "@/lib/utils";
import { REGIONS, PREFECTURES, PREF_TO_REGION } from "@/lib/regions";

type Filters = {
  q: string;
  minRating: number;
  withPhoto: boolean;
  type: string;
  region?: string;
  prefectures?: string[]; // 複数
};

type Props = {
  activeCount: number;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  typeOptions: string[];
  resultCount: number;
  className?: string;
  regionCounts: Record<string, number>;
  prefectureCounts: Record<string, number>;
};

export default function FloatingFilter(props: Props) {
  const { className } = props;

  const allPrefsInRegion = (region?: string) =>
    region ? PREFECTURES.filter(p => PREF_TO_REGION[p] === region) : PREFECTURES;

  const filteredPrefs = allPrefsInRegion(props.filters.region);

  const togglePref = (pref: string) => {
    props.setFilters(f => {
      const cur = new Set(f.prefectures ?? []);
      if (cur.has(pref)) cur.delete(pref); else cur.add(pref);
      return { ...f, prefectures: Array.from(cur) };
    });
  };

  const selectAll = () => {
    props.setFilters(f => ({
      ...f,
      prefectures: filteredPrefs.slice(), // その地方の全て
    }));
  };

  const clearAll = () => {
    props.setFilters(f => ({ ...f, prefectures: [] }));
  };

  return (
    <Portal>
      {/* FAB */}
      <div className="pointer-events-none fixed inset-0 z-[60]">
        <div className={cn("pointer-events-auto fixed right-6 bottom-[calc(env(safe-area-inset-bottom)+24px)]", className)}>
          <button
            type="button"
            onClick={() => props.setOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-3 text-white shadow-xl hover:bg-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path fill="currentColor" d="M4 6h16v2H4zm3 5h10v2H7zm3 5h4v2h-4z" />
            </svg>
            <span className="hidden sm:inline">絞り込み</span>
            {props.activeCount > 0 && (
              <span className="ml-1 rounded-full bg-white/20 px-2 text-xs">{props.activeCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* モーダル */}
      {props.isOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[70]"
             onKeyDown={(e) => e.key === "Escape" && props.setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" onClick={() => props.setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-lg rounded-t-2xl bg-white shadow-xl sm:inset-0 sm:m-auto sm:h-auto sm:max-w-md sm:rounded-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-base font-semibold">絞り込み</h2>
              <button className="rounded-md p-2 hover:bg-gray-100" onClick={() => props.setOpen(false)} aria-label="閉じる">✕</button>
            </div>

            <div className="space-y-4 p-4">
              {/* キーワード */}
              <label className="block space-y-1">
                <span className="text-sm text-gray-600">キーワード</span>
                <input
                  type="text"
                  value={props.filters.q}
                  onChange={(e) => props.setFilters(f => ({ ...f, q: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="店名・住所で検索"
                />
              </label>

              {/* 地方 */}
              <label className="block space-y-1">
                <span className="text-sm text-gray-600">地方</span>
                <select
                  value={props.filters.region ?? ""}
                  onChange={(e) => {
                    const region = e.target.value || undefined;
                    props.setFilters(f => {
                      // 地方変更時は その地方の都道府県を全選択にする
                      const nextPrefs = region ? allPrefsInRegion(region) : [];
                      return { ...f, region, prefectures: nextPrefs };
                    });
                  }}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  <option value="">
                    指定なし（
                    {Object.values(props.regionCounts).reduce((a, b) => a + b, 0)}
                    ）
                  </option>
                  {REGIONS.map(r => {
                    const c = props.regionCounts[r] ?? 0;
                    return (
                      <option key={r} value={r}>
                        {r}（{c}）
                      </option>
                    );
                  })}
                </select>
              </label>

              {/* 都道府県（複数チェック） */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600">都道府県（複数選択可）</span>
                  <div className="flex gap-2">
                    <button type="button" className="text-xs underline text-gray-600 hover:text-gray-800" onClick={selectAll}>全て選択</button>
                    <button type="button" className="text-xs underline text-gray-600 hover:text-gray-800" onClick={clearAll}>全て解除</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-48 overflow-auto pr-1">
                  {filteredPrefs.map(p => {
                    const checked = (props.filters.prefectures ?? []).includes(p);
                    const cnt = props.prefectureCounts[p] ?? 0;
                    return (
                      <label key={p} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={() => togglePref(p)}
                        />
                        <span className="flex-1">{p}</span>
                        {/* <span className="text-xs text-gray-500">{cnt}</span> */}
                        {/* ← 数字バッジ */}
                        <span
                          className={[
                            "ml-2 inline-flex min-w-[1.5rem] justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
                            checked
                              ? "bg-sky-600 text-white"
                              : cnt > 0
                                ? "bg-sky-100 text-sky-700"
                                : "bg-gray-100 text-gray-400"
                          ].join(" ")}
                          aria-label={`${p} の件数`}
                          title={`${p} の件数`}
                        >
                          {cnt}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {/* 地方のみ選択・都道府県0件でも、表示側は地方条件で全件表示されます */}
              </div>

              {/* 最低評価 */}
              <label className="block space-y-1">
                <span className="text-sm text-gray-600">最低評価</span>
                <select
                  value={props.filters.minRating}
                  onChange={(e) => props.setFilters(f => ({ ...f, minRating: Number(e.target.value) }))}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  <option value={0}>指定なし</option>
                  <option value={3.5}>3.5以上</option>
                  <option value={4.0}>4.0以上</option>
                  <option value={4.5}>4.5以上</option>
                </select>
              </label>

              {/* 写真あり */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={props.filters.withPhoto}
                  onChange={(e) => props.setFilters(f => ({ ...f, withPhoto: e.target.checked }))}
                  className="h-4 w-4"
                />
                <span className="text-sm">写真ありのみ</span>
              </label>

              {/* 種別 */}
              <label className="block space-y-1">
                <span className="text-sm text-gray-600">カテゴリー</span>
                <select
                  value={props.filters.type}
                  onChange={(e) => props.setFilters(f => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  <option value="">指定なし</option>
                  {props.typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
              <button
                className="text-sm text-gray-600 underline"
                onClick={() =>
                  props.setFilters({ q: "", minRating: 0, withPhoto: false, type: "", region: undefined, prefectures: [] })
                }
              >
                リセット
              </button>
              <div className="flex gap-2">
                <button className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" onClick={() => props.setOpen(false)}>閉じる</button>
                <button className="rounded-lg bg-sky-500 px-4 py-2 text-sm text-white hover:bg-sky-600" onClick={() => props.setOpen(false)}>
                  この条件で表示（{props.resultCount}件）
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Portal>
  );
}
