export function placePhotoUrl(ref?: string | null, w = 400, h = 300) {
  if (!ref) return "";
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  return `https://maps.googleapis.com/maps/api/place/photo?photo_reference=${encodeURIComponent(
    ref
  )}&maxwidth=${w}&maxheight=${h}&key=${key}`;
}
