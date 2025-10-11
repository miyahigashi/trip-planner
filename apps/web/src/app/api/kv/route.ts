import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET() {
  const key = "hello";
  await redis.set(key, "world", { ex: 60 }); // TTL 60秒
  const val = await redis.get<string>(key);
  const ttl = await redis.ttl(key);
  return NextResponse.json({ ok: true, key, val, ttl });
}
