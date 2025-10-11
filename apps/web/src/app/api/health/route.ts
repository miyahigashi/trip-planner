import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    const r = await db.execute("select now()");
    return NextResponse.json({ ok: true, now: r.rows?.[0] ?? null });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}