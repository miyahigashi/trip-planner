// apps/web/src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
export const runtime = "nodejs";

type NowRow = { now: string };

export async function GET() {
  try {
    const r = await db.execute<NowRow>(sql`select now() as now`);
    const now = r.rows[0]?.now ?? null;
    return NextResponse.json({
      ok: true,
      db: "ok",
      now,
      env: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        GOOGLE_MAPS_API_KEY: !!process.env.GOOGLE_MAPS_API_KEY,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
