"use client";

import Image from "next/image";
import SignedImage from "@/components/SignedImage";
import { useState, useTransition } from "react";
import NoteButton from "./NoteButton";

type Item = {
  placeId: string;
  name: string | null;
  prefecture: string | null;
  imageUrl: string | null;
  photoRef: string | null;
  note: string | null;
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
    const items: { placeId: string; dayIndex: number; orderInDay: number , note: string | null}[] = [];
    next.forEach((d) =>
      d.items.forEach((it, i) =>
        items.push({
          placeId: it.placeId,
          dayIndex: Number(d.dayIndex),
          orderInDay: Number(i),
          note: it.note ?? null,
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
  function patchNote(placeId: string, nextNote: string | null) {
  setDays((prev) =>
    prev.map((d) => ({
      ...d,
      items: d.items.map((it) =>
        it.placeId === placeId ? { ...it, note: nextNote } : it
      ),
    }))
  );
}

  return (
    <div className="mt-6 space-y-6">

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
                    <NoteButton
                      projectId={projectId}
                      placeId={it.placeId}
                      initialNote={it.note ?? null}
                      className="absolute right-3 top-3" // 置きたい位置に
                      onSaved={(n) => patchNote(it.placeId, n)}
                    />
                  </div>

                  <div className="p-3">
                    <div className="font-medium line-clamp-1">{it.name}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {it.prefecture}
                    </div>
                    {it.note && (
                      <div className="mt-2 rounded-lg bg-amber-50/70 ring-1 ring-amber-200 px-3 py-2 text-sm text-amber-900">
                        <span className="mr-1">📝</span>
                        <span className="whitespace-pre-wrap break-words">{it.note}</span>
                      </div>
                    )}
                    {/* --- アクションバー（置き換え） --- */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        {/* 上/下（小ボタン） */}
                        <div className="flex gap-2">
                          <button
                            aria-label="上へ"
                            onClick={() => moveUp(d.dayIndex, i)}
                            disabled={isPending || i === 0}
                            className={[
                              "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border",
                              "bg-white px-2 text-sm shadow-sm hover:bg-slate-50",
                              "disabled:opacity-50 disabled:cursor-not-allowed",
                            ].join(" ")}
                          >
                            ▲
                          </button>
                          <button
                            aria-label="下へ"
                            onClick={() => moveDown(d.dayIndex, i)}
                            disabled={isPending || i === d.items.length - 1}
                            className={[
                              "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border",
                              "bg-white px-2 text-sm shadow-sm hover:bg-slate-50",
                              "disabled:opacity-50 disabled:cursor-not-allowed",
                            ].join(" ")}
                          >
                            ▼
                          </button>
                        </div>

                        {/* 前日/次日（セグメント） */}
                        <div className="flex items-center rounded-full border bg-white p-0.5 shadow-sm">
                          <button
                            onClick={() => moveToDay(d.dayIndex, i, d.dayIndex - 1)}
                            disabled={
                              isPending || d.dayIndex === Math.min(...days.map((x) => x.dayIndex))
                            }
                            className={[
                              "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm",
                              "hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed",
                            ].join(" ")}
                          >
                            <span className="-ml-0.5">◀</span> 前日
                          </button>

                          <span className="mx-0.5 h-6 w-px bg-slate-200" aria-hidden />

                          <button
                            onClick={() => moveToDay(d.dayIndex, i, d.dayIndex + 1)}
                            disabled={isPending}
                            className={[
                              "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm",
                              "hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed",
                            ].join(" ")}
                          >
                            次日 <span className="-mr-0.5">▶</span>
                          </button>
                        </div>
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
