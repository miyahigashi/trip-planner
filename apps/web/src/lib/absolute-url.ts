// apps/web/src/lib/absolute-url.ts
import "server-only";
import { headers } from "next/headers";

export async function absoluteUrl(path: string) {
  const h = await headers();
  const host  = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) throw new Error("host header not found");
  return `${proto}://${host}${path}`;
}