import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, MediaItem } from "@/lib/db";
import { getJob, setJob } from "@/lib/downloads";
import { generateThumbnail } from "@/lib/thumbnail";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const YTDLP_PATH = "/usr/bin/yt-dlp";
const MEDIA_BASE = process.env.MEDIA_PATH || "/media";
const COOKIES_PATH = "/app/data/cookies.txt";

function ytdlpArgs(): string[] {
  const args = ["--js-runtimes", "node", "--remote-components", "ejs:github"];
  if (fs.existsSync(COOKIES_PATH)) args.push("--cookies", COOKIES_PATH);
  return args;
}

// GET — return current download status for this media item
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseInt(params.id);
  const job = getJob(id);
  if (!job) return NextResponse.json({ status: "idle" });
  return NextResponse.json(job);
}

// POST — start downloading this media item to local storage
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseInt(params.id);

  // Reject if already in progress
  const existing = getJob(id);
  if (existing && (existing.status === "pending" || existing.status === "downloading")) {
    return NextResponse.json({ error: "Already downloading" }, { status: 409 });
  }

  const db = getDb();
  const item = db.prepare("SELECT * FROM media WHERE id = ?").get(id) as MediaItem | undefined;

  if (!item || !item.url) {
    return NextResponse.json({ error: "No URL to download" }, { status: 400 });
  }
  if (item.filename) {
    return NextResponse.json({ error: "Already a local file" }, { status: 400 });
  }

  setJob(id, { status: "pending", progress: "Starting download..." });

  const outputTemplate = path.join(MEDIA_BASE, `${id}.%(ext)s`);
  const args = [
    ...ytdlpArgs(),
    "--no-playlist",
    "--merge-output-format", "mp4",
    "-o", outputTemplate,
    "--", item.url,
  ];

  const child = spawn(YTDLP_PATH, args);

  // Parse progress from stderr
  child.stderr.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes("[download]") && trimmed.includes("%")) {
        const progress = trimmed.replace(/^\[download\]\s*/, "");
        setJob(id, { status: "downloading", progress });
      }
    }
  });

  child.on("close", (code) => {
    if (code === 0) {
      // Find the downloaded file (scan for files starting with this ID)
      let filename: string | undefined;
      try {
        const files = fs.readdirSync(MEDIA_BASE);
        const found = files.find(
          (f) => f.startsWith(`${id}.`) && !f.endsWith(".part") && !f.endsWith(".ytdl")
        );
        if (found) filename = found;
      } catch { /* ignore */ }

      if (filename) {
        const db2 = getDb();
        db2
          .prepare("UPDATE media SET filename = ?, needs_ytdlp = 0 WHERE id = ?")
          .run(filename, id);
        setJob(id, { status: "done", progress: "Download complete", filename });
        // Auto-generate thumbnail in the background if item has no thumbnail
        if (!item.thumbnail_url) {
          generateThumbnail(id).catch(() => {});
        }
      } else {
        setJob(id, { status: "error", progress: "", error: "Downloaded file not found on disk" });
      }
    } else {
      setJob(id, { status: "error", progress: "", error: `yt-dlp exited with code ${code}` });
    }
  });

  return NextResponse.json({ status: "started" });
}
