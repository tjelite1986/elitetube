import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { pin } = body as { pin?: string };

  if (!pin || pin.length < 4) {
    return NextResponse.json({ error: "PIN måste vara minst 4 tecken" }, { status: 400 });
  }

  const hash = await bcrypt.hash(pin, 12);
  const db = getDb();
  db.prepare("INSERT INTO settings (key, value) VALUES ('adult_pin_hash', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(hash);

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'adult_pin_hash'").get();
  return NextResponse.json({ hasPin: !!row });
}
