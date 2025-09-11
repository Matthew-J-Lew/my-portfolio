// src/app/api/public-email/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const email = process.env.CONTACT_EMAIL; // DO NOT prefix with NEXT_PUBLIC_
  if (!email) {
    return NextResponse.json({ ok: false, error: "Email not configured" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, email });
}
