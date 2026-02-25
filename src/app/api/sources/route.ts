import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const sources = db.prepare("SELECT * FROM sources ORDER BY name").all();
  return NextResponse.json(sources);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, type, path, description } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "name and type are required" }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare("INSERT INTO sources (name, type, path, description) VALUES (?, ?, ?, ?)")
    .run(name, type, path || null, description || null);

  const created = db.prepare("SELECT * FROM sources WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is missing" }, { status: 400 });

  const db = getDb();
  db.prepare("DELETE FROM sources WHERE id = ?").run(parseInt(id));
  return NextResponse.json({ ok: true });
}
