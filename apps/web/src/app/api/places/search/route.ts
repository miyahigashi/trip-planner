import { NextRequest, NextResponse } from "next/server";
import { cachedJSON } from "@/lib/cache";

const TTL = 60 * 60 * 24 * 2; // 48h

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "q is required" }, { status: 400 });

  try {
    const results = await cachedJSON(`places:q:${q}`, TTL, async () => {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
      url.searchParams.set("query", q);
      url.searchParams.set("language", "ja");
      url.searchParams.set("region", "jp");
      url.searchParams.set("key", process.env.GOOGLE_MAPS_API_KEY!);

      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(`${data.status}: ${data.error_message ?? ""}`);
      }
      return (data.results ?? []).map((r: any) => ({
        placeId: r.place_id as string,
        name: r.name as string,
        address: r.formatted_address as string | undefined,
        lat: r.geometry?.location?.lat as number | undefined,
        lng: r.geometry?.location?.lng as number | undefined,
        rating: r.rating as number | undefined,
        userRatingsTotal: r.user_ratings_total as number | undefined,
        types: r.types as string[] | undefined,
        photoRef: (r.photos && r.photos[0]?.photo_reference) || undefined,
      }));
    });

    return NextResponse.json({ from: "ok", results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
