"use client";

import Image from "next/image";
import SignedImage from "@/components/SignedImage";
import { useState, useTransition } from "react";

type Item = {
  placeId: string;
  name: string | null;
  prefecture: string | null;
  imageUrl: string | null;
  photoRef: string | null;
};
type Day = { dayIndex: number; items: Item[] };

export default function SelectionsBoard({
  projectId,
  initialDays,
}: {
  projectId: string;
  initialDays: Day[];
}) {
  const [days, setDays] = useState<Day[]>(initialDays);
  const [isPending, startTransition] = useTransition();

  const photoUrl = (ref?: string | null) =>
    ref
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      : "/placeholder.jpg";

  async function persist(next: Day[]) {
    // payload を API が期待する形（items）で送る
    const items: { placeId: string; dayIndex: number; orderInDay: number }[] = [];
    next.forEach((d) =>
      d.items.forEach((it, i) =>
        items.push({
          placeId: it.placeId,
          dayIndex: Number(d.dayIndex),
          orderInDay: Number(i),
        })
      )
    );

    const res = await fetch(`/api/projects/${projectId}/selections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      alert(`保存に失敗しました\n${res.status} ${msg}`);
      throw new Error(`${res.status} ${msg}`);
    }
  }

  const save = (next: Day[]) => {
    startTransition(async () => {
      setDays(next);
      try {
        await persist(next);
      } catch {
        // 失敗時は現在の表示を強制同期したい場合は reload
        // location.reload();
      }
    });
  };

  const moveUp = (dayIdx: number, i: number) => {
    const next = structuredClone(days);
    const day = next.find((d) => d.dayIndex === dayIdx)!;
    if (i <= 0) return;
    [day.items[i - 1], day.items[i]] = [day.items[i], day.items[i - 1]];
    save(next);
  };

  const moveDown = (dayIdx: number, i: number) => {
    const next = structuredClone(days);
    const day = next.find((d) => d.dayIndex === dayIdx)!;
    if (i >= day.items.length - 1) return;
    [day.items[i + 1], day.items[i]] = [day.items[i], day.items[i + 1]];
    save(next);
  };

  const moveToDay = (fromDay: number, i: number, toDay: number) => {
    const next = structuredClone(days);
    const src = next.find((d) => d.dayIndex === fromDay)!;
    const dst =
      next.find((d) => d.dayIndex === toDay) ??
      (() => {
        const d = { dayIndex: toDay, items: [] as Item[] };
        next.push(d);
        next.sort((a, b) => a.dayIndex - b.dayIndex);
        return d;
      })();
    const [it] = src.items.splice(i, 1);
    dst.items.push(it);
    save(next);
  };

  const addDay = () => {
    const max = Math.max(...days.map((d) => d.dayIndex));
    const next = [...days, { dayIndex: max + 1, items: [] }];
    next.sort((a, b) => a.dayIndex - b.dayIndex);
    save(next);
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="flex justify-end">
        <button
          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          onClick={addDay}
          disabled={isPending}
        >
          + Day を追加
        </button>
      </div>

      {days.map((d) => (
        <section key={d.dayIndex} className="space-y-3">
          <h2 className="text-lg font-semibold">
            Day {d.dayIndex + 1}{" "}
            <span className="text-slate-500 text-sm">（{d.items.length}件）</span>
          </h2>

          {d.items.length === 0 ? (
            <div className="rounded-xl border bg-white/70 p-6 text-slate-500 text-sm">
              この日にまだスポットがありません。
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {d.items.map((it, i) => (
                <li
                  key={it.placeId}
                  className="rounded-2xl border bg-white shadow-sm overflow-hidden"
                >
                  <div className="aspect-[4/3] relative bg-slate-100">
                    {it.imageUrl ? (
                      <SignedImage
                        objectKey={it.imageUrl}
                        alt={it.name ?? "スポット"}
                        width={800}
                        height={600}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={photoUrl(it.photoRef)}
                        alt={it.name ?? "スポット"}
                        width={800}
                        height={600}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="p-3">
                    <div className="font-medium line-clamp-1">{it.name}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {it.prefecture}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                        onClick={() => moveUp(d.dayIndex, i)}
                        disabled={isPending || i === 0}
                      >
                        ↑ 上へ
                      </button>
                      <button
                        className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                        onClick={() => moveDown(d.dayIndex, i)}
                        disabled={isPending || i === d.items.length - 1}
                      >
                        ↓ 下へ
                      </button>
                      <button
                        className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                        onClick={() => moveToDay(d.dayIndex, i, d.dayIndex - 1)}
                        disabled={
                          isPending ||
                          d.dayIndex === Math.min(...days.map((x) => x.dayIndex))
                        }
                      >
                        ◀ 前日へ
                      </button>
                      <button
                        className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                        onClick={() => moveToDay(d.dayIndex, i, d.dayIndex + 1)}
                        disabled={isPending}
                      >
                        次日へ ▶
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
