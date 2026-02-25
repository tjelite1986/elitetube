import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isYouTubeUrl, extractYouTubeId, getYouTubeThumbnail } from "@/lib/media";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  let sql = "SELECT * FROM media WHERE 1=1";
  const params: (string | number)[] = [];

  if (q) {
    sql += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }

  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const items = db.prepare(sql).all(...params);
  const total = (db.prepare("SELECT COUNT(*) as c FROM media").get() as { c: number }).c;

  return NextResponse.json({ items, total });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, type, source_id, filename, url, thumbnail_url, duration, category, tags, needs_ytdlp, is_adult } = body;

  if (!title || !type) {
    return NextResponse.json({ error: "title and type are required" }, { status: 400 });
  }

  // Auto-thumbnail for YouTube
  let thumb = thumbnail_url;
  if (!thumb && url && isYouTubeUrl(url)) {
    const ytId = extractYouTubeId(url);
    if (ytId) thumb = getYouTubeThumbnail(ytId);
  }

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO media (source_id, title, description, type, filename, url, thumbnail_url, duration, category, tags, needs_ytdlp, is_adult)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(source_id || null, title, description || null, type, filename || null, url || null, thumb || null, duration || null, category || null, tags || null, needs_ytdlp ? 1 : 0, is_adult ? 1 : 0);

  const created = db.prepare("SELECT * FROM media WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(created, { status: 201 });
}
