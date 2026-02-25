import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { pin } = body as { pin?: string };

  if (!pin) {
    return NextResponse.json({ error: "PIN is required" }, { status: 400 });
  }

  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'adult_pin_hash'").get() as { value: string } | undefined;

  if (!row) {
    return NextResponse.json({ error: "No PIN has been set" }, { status: 400 });
  }

  const ok = await bcrypt.compare(pin, row.value);
  if (!ok) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("adult_unlocked", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // session cookie (no maxAge)
  });
  return response;
}
