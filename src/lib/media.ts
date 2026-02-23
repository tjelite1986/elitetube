import { MediaItem } from "./db";

export function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#]+)/,
    /embed\/([^?&#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M visningar`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K visningar`;
  return `${views} visningar`;
}

export function getMediaStreamUrl(item: MediaItem): string {
  if (item.url) return item.url;
  if (item.filename) return `/api/stream/${item.id}`;
  return "";
}

function isDirectMediaUrl(url: string): boolean {
  return /\.(mp4|m4v|m4a|mp3|webm|ogg|avi|mkv|flv|mov|wav|flac|aac|jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(url);
}

export function getMediaType(item: MediaItem): "youtube" | "direct" | "local" | "ytdlp" {
  if (item.needs_ytdlp) return "ytdlp";
  if (item.url && isYouTubeUrl(item.url)) return "youtube";
  if (item.url && isDirectMediaUrl(item.url)) return "direct";
  if (item.url) return "ytdlp"; // webb-URL (pornhub m.fl.) → yt-dlp automatiskt
  return "local";
}
