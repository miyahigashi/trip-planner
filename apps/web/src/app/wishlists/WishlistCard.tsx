// 例: apps/web/src/app/wishlists/WishlistCard.tsx
import PublishToProject from "./PublishToProject";

export default function WishlistCard({ item }: { item: { placeId: string } }) {
  // ... 画像やタイトルなど
  return (
    <div>
      {/* 既存UI */}
      <div className="mt-2">
        <PublishToProject placeId={item.placeId} />
      </div>
    </div>
  );
}
