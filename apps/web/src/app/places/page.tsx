"use client";
import { useState } from "react";

// 最低限の PlaceItem 型（必要に応じて拡張）
type PlaceItem = {
  id: string;            // ← schema が id の場合
  name: string;
  address?: string | null;
};

function WishBtn({ place }: { place: PlaceItem }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 省略: ボタンの挙動
  return (
    <button disabled={saving || saved} className="rounded px-3 py-1 border">
      {saved ? "Saved" : saving ? "Saving..." : "Save"}
    </button>
  );
}

export default function Page() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Places</h1>
      {/* コンテンツ… */}
    </div>
  );
}
