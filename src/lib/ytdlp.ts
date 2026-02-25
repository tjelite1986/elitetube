import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const YTDLP_PATH = "/usr/bin/yt-dlp";
// Prioritize direct HTTPS MP4 streams over HLS (m3u8) for browser compatibility
const FORMAT = "best[protocol=https][ext=mp4]/best[protocol=https]/bestvideo[protocol=https]+bestaudio[protocol=https]/best[ext=mp4]/best";

export type YtdlpMeta = {
  title: string;
  duration: number | null;
  thumbnail: string | null;
  description: string | null;
  tags: string[];
};

export async function fetchYtdlpMeta(url: string): Promise<YtdlpMeta> {
  const { stdout } = await execFileAsync(
    YTDLP_PATH,
    ["--dump-json", "--no-playlist", "--", url],
    { timeout: 20_000 }
  );
  const data = JSON.parse(stdout);

  // yt-dlp returns tags and categories as arrays
  const rawTags: unknown[] = Array.isArray(data.tags) ? data.tags : [];
  const rawCats: unknown[] = Array.isArray(data.categories) ? data.categories : [];
  const tags = Array.from(new Set([...rawTags, ...rawCats].map(String).filter(Boolean)));

  return {
    title:       data.title       ?? "Unknown title",
    duration:    data.duration    ?? null,
    thumbnail:   data.thumbnail   ?? null,
    description: data.description ?? null,
    tags,
  };
}

export async function resolveYtdlpUrl(url: string): Promise<string> {
  const { stdout } = await execFileAsync(
    YTDLP_PATH,
    ["-g", "--no-playlist", "-f", FORMAT, "--", url],
    { timeout: 15_000 }
  );
  const lines = stdout.trim().split("\n").filter(Boolean);
  if (!lines.length) throw new Error("yt-dlp returned no URL");
  return lines[0];
}
