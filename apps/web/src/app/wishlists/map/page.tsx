export const dynamic = "force-dynamic";
export const revalidate = 0;

// ✅ dynamic import は不要。Client Component をそのまま読み込む
import MapScreen from "./MapScreen";

export default function Page() {
  return <MapScreen />;
}