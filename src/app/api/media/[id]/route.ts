import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const item = db.prepare("SELECT * FROM media WHERE id = ?").get(parseInt(params.id));
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Increment views
  db.prepare("UPDATE media SET views = views + 1 WHERE id = ?").run(parseInt(params.id));

  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, type, filename, url, thumbnail_url, duration, category, tags, needs_ytdlp, is_adult } = body;

  const db = getDb();
  db.prepare(
    `UPDATE media SET title=?, description=?, type=?, filename=?, url=?, thumbnail_url=?, duration=?, category=?, tags=?, needs_ytdlp=?, is_adult=?
     WHERE id=?`
  ).run(title, description || null, type, filename || null, url || null, thumbnail_url || null, duration || null, category || null, tags || null, needs_ytdlp ? 1 : 0, is_adult ? 1 : 0, parseInt(params.id));

  const updated = db.prepare("SELECT * FROM media WHERE id = ?").get(parseInt(params.id));
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  db.prepare("DELETE FROM media WHERE id = ?").run(parseInt(params.id));
  return NextResponse.json({ ok: true });
}
