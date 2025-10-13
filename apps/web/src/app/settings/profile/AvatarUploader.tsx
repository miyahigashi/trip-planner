"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import SignedImage from "@/components/SignedImage";

type Props = {
  name?: string;
  defaultKey?: string | null;
};

export default function AvatarUploader({ name = "avatarKey", defaultKey }: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const [objectKey, setObjectKey] = useState<string | null>(defaultKey ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const res = await fetch("/api/uploads/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type }),
      });
      if (!res.ok) throw new Error("signed url failed");
      const { uploadUrl, objectKey } = await res.json();

      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("upload failed");

      setObjectKey(objectKey);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (err) {
      console.error(err);
      alert("画像アップロードに失敗しました。もう一度お試しください。");
      setObjectKey(defaultKey ?? null);
      setPreviewUrl(null);
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white/60 p-4">
      {/* 横並び＋狭い時は折返し */}
      <div className="flex flex-wrap items-center gap-4">
        {/* 丸プレビュー（80px） */}
        <div className="shrink-0 size-20 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="preview"
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : objectKey ? (
            <SignedImage
              objectKey={objectKey}
              alt="avatar"
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-[10px] text-slate-400">
              No Image
            </div>
          )}
        </div>

        {/* 操作列 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {/* inputは隠し、ラベルをボタン化 */}
            <input
              id={inputId}
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleSelect}
              disabled={busy}
              className="sr-only"
            />
            <label
              htmlFor={inputId}
              aria-disabled={busy}
              className="
                inline-flex h-10 cursor-pointer items-center rounded-xl
                bg-sky-600 px-4 text-sm font-semibold text-white shadow
                hover:bg-sky-700 disabled:cursor-default disabled:opacity-50
                whitespace-nowrap
              "
            >
              {busy ? "アップロード中…" : "画像を選ぶ"}
            </label>

            {/* 長いキーは省略表示 */}
            <span className="truncate text-sm text-slate-600 max-w-[220px] sm:max-w-[320px]">
              {previewUrl ? "新しい画像を選択中" : objectKey ?? "未選択"}
            </span>
          </div>

          {/* 説明は折返しのため1行占有 */}
          <p className="mt-1 text-xs text-slate-500">
            JPG / PNG / WebP など。最大数MB程度を推奨。
          </p>
        </div>
      </div>

      {/* submit 用 hidden */}
      <input type="hidden" name={name} value={objectKey ?? ""} />
    </div>
  );
}
