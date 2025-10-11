import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({ keyHead: (process.env.GOOGLE_MAPS_API_KEY||"").slice(0,8) });
}