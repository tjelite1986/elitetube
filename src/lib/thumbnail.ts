import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { getDb } from "./db";

const execFileAsync = promisify(execFile);
const FFMPEG_PATH = "/usr/bin/ffmpeg";
const MEDIA_BASE = process.env.MEDIA_PATH || "/media";

/**
 * Generate a JPEG thumbnail for a local media file using ffmpeg.
 * Seeks to 10% of duration (max 60s), falls back to 10s if that fails.
 * Updates thumbnail_url in the DB on success.
 * Returns the thumbnail URL or null on failure.
 */
export async function generateThumbnail(mediaId: number): Promise<string | null> {
  const db = getDb();
  const item = db
    .prepare("SELECT filename, duration, type FROM media WHERE id = ?")
    .get(mediaId) as { filename?: string; duration?: number; type: string } | undefined;

  if (!item?.filename || item.type === "image") return null;

  const filePath = item.filename.startsWith("/")
    ? item.filename
    : path.join(MEDIA_BASE, item.filename);

  if (!fs.existsSync(filePath)) return null;

  const thumbDir = path.join(MEDIA_BASE, "thumbnails");
  fs.mkdirSync(thumbDir, { recursive: true });

  const outPath = path.join(thumbDir, `${mediaId}.jpg`);
  const seek = item.duration ? Math.min(Math.floor(item.duration * 0.1), 60) : 10;

  const run = (args: string[]) =>
    execFileAsync(FFMPEG_PATH, args, { timeout: 30_000 });

  try {
    await run(["-ss", String(seek), "-i", filePath, "-frames:v", "1", "-q:v", "3", "-f", "image2", "-y", outPath]);
  } catch {
    try {
      await run(["-i", filePath, "-frames:v", "1", "-q:v", "3", "-f", "image2", "-y", outPath]);
    } catch {
      return null;
    }
  }

  if (!fs.existsSync(outPath)) return null;

  const thumbUrl = `/api/thumbnails/${mediaId}`;
  db.prepare("UPDATE media SET thumbnail_url = ? WHERE id = ?").run(thumbUrl, mediaId);
  return thumbUrl;
}
