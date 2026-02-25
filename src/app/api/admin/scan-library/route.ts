import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import fs from "fs";
import path from "path";

const MEDIA_BASE = process.env.MEDIA_PATH || "/media";

const VIDEO_EXTS = new Set([".mp4", ".mkv", ".avi", ".mov", ".webm", ".m4v", ".flv", ".wmv", ".ts", ".mpg", ".mpeg"]);
const AUDIO_EXTS = new Set([".mp3", ".flac", ".aac", ".ogg", ".m4a", ".wav", ".opus", ".wma"]);
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"]);

function detectType(ext: string): "video" | "audio" | "image" | null {
  if (VIDEO_EXTS.has(ext)) return "video";
  if (AUDIO_EXTS.has(ext)) return "audio";
  if (IMAGE_EXTS.has(ext)) return "image";
  return null;
}

function fileToTitle(filename: string): string {
  const base = path.basename(filename, path.extname(filename));
  return base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let files: string[];
  try {
    files = fs.readdirSync(MEDIA_BASE);
  } catch {
    return NextResponse.json({ error: `Cannot read directory: ${MEDIA_BASE}` }, { status: 500 });
  }

  const db = getDb();

  // Get all existing filenames (relative and absolute) from DB
  const existing = new Set(
    (db.prepare("SELECT filename FROM media WHERE filename IS NOT NULL").all() as { filename: string }[])
      .map((r) => path.basename(r.filename))
  );

  const added: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const type = detectType(ext);
    if (!type) continue; // not a media file

    const stat = fs.statSync(path.join(MEDIA_BASE, file));
    if (!stat.isFile()) continue;

    if (existing.has(file)) {
      skipped.push(file);
      continue;
    }

    const title = fileToTitle(file);
    db.prepare(
      `INSERT INTO media (title, type, filename, views, likes, dislikes, needs_ytdlp, is_adult)
       VALUES (?, ?, ?, 0, 0, 0, 0, 0)`
    ).run(title, type, file);

    added.push(file);
  }

  return NextResponse.json({ added: added.length, skipped: skipped.length, files: added });
}
