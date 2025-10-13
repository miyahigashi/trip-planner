import { NextResponse } from "next/server";
import { findUserByIdentifier } from "@/lib/users";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q) return NextResponse.json({ error: "q required" }, { status: 400 });

  const user = await findUserByIdentifier(q);
  return NextResponse.json({ user });
}
