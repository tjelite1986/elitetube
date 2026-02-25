import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { execFile } from "child_process";
import { promisify } from "util";
import { isYouTubeUrl } from "@/lib/media";

const execFileAsync = promisify(execFile);
const YTDLP_PATH = "/usr/bin/yt-dlp";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { url, category, is_adult } = body as {
    url?: string;
    category?: string;
    is_adult?: boolean;
  };

  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

  let stdout: string;
  try {
    const result = await execFileAsync(
      YTDLP_PATH,
      ["--flat-playlist", "--dump-json", "--", url],
      { timeout: 180_000, maxBuffer: 100 * 1024 * 1024 }
    );
    stdout = result.stdout;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `yt-dlp error: ${msg}` }, { status: 500 });
  }

  const lines = stdout.trim().split("\n").filter(Boolean);
  if (lines.length === 0) {
    return NextResponse.json({ error: "No videos found in the playlist" }, { status: 400 });
  }

  const db = getDb();
  let imported = 0;
  const errors: string[] = [];

  const insert = db.prepare(`
    INSERT INTO media (title, type, url, thumbnail_url, duration, category, needs_ytdlp, is_adult)
    VALUES (?, 'video', ?, ?, ?, ?, ?, ?)
  `);

  const importMany = db.transaction(() => {
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);

        // Build video URL
        let videoUrl: string | null = null;
        if (entry.url && entry.url.startsWith("http")) {
          videoUrl = entry.url;
        } else if (entry.webpage_url) {
          videoUrl = entry.webpage_url;
        } else if (entry.id && isYouTubeUrl(url)) {
          videoUrl = `https://www.youtube.com/watch?v=${entry.id}`;
        }

        if (!videoUrl) {
          errors.push(`No URL for: ${entry.title || entry.id || "unknown"}`);
          continue;
        }

        const needsYtdlp = isYouTubeUrl(videoUrl) ? 0 : 1;
        const thumbnail: string | null =
          entry.thumbnail ||
          (isYouTubeUrl(videoUrl) && entry.id
            ? `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`
            : null);
        const duration = entry.duration ? Math.round(entry.duration) : null;
        const title: string = entry.title || videoUrl;

        insert.run(title, videoUrl, thumbnail, duration, category || null, needsYtdlp, is_adult ? 1 : 0);
        imported++;
      } catch {
        errors.push("Parse error on one entry");
      }
    }
  });

  importMany();

  return NextResponse.json({
    imported,
    total: lines.length,
    errors: errors.slice(0, 20),
  });
}
