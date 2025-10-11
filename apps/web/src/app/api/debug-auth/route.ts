import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId, sessionId } = await auth();   // ← await が必要
  return NextResponse.json({ userId, sessionId });
}