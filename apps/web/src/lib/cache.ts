import { redis } from "@/lib/redis";

export async function cachedJSON<T>(
  key: string,
  ttlSec: number,
  loader: () => Promise<T>
): Promise<T> {
  const hit = await redis.get<T>(key);
  if (hit) return hit;
  const data = await loader();
  await redis.set(key, data, { ex: ttlSec });
  return data;
}
