import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

type Row = { now: string | Date };

export const runtime = "nodejs";

export async function GET() {
  try {
    const res: any = await db.execute(sql`select now() as now`);
    const row: Row | undefined = res?.rows?.[0];
    const now = row?.now ?? null;

    return NextResponse.json({ ok: true, now });
  } catch (e) {
    console.error("[/api/health/db] DB ERROR:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
