"use client";

import { useState } from "react";

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function LikeButtons({
  mediaId,
  initialLikes,
  initialDislikes,
}: {
  mediaId: number;
  initialLikes: number;
  initialDislikes: number;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [voted, setVoted] = useState<"like" | "dislike" | null>(null);

  async function vote(action: "like" | "dislike") {
    if (voted) return;
    setVoted(action);
    if (action === "like") setLikes((l) => l + 1);
    else setDislikes((d) => d + 1);
    await fetch(`/api/media/${mediaId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  }

  const total = likes + dislikes;
  const pct = total > 0 ? Math.round((likes / total) * 100) : null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        <button
          onClick={() => vote("like")}
          disabled={!!voted}
          title="Good video"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-l-full border text-sm font-medium transition-colors ${
            voted === "like"
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-yt-surface border-yt-border text-yt-text hover:bg-yt-hover"
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
          </svg>
          {likes > 0 && <span>{fmt(likes)}</span>}
        </button>
        <div className="w-px h-7 bg-yt-border" />
        <button
          onClick={() => vote("dislike")}
          disabled={!!voted}
          title="Bad video"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-r-full border border-l-0 text-sm font-medium transition-colors ${
            voted === "dislike"
              ? "bg-red-700 border-red-700 text-white"
              : "bg-yt-surface border-yt-border text-yt-text hover:bg-yt-hover"
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
          </svg>
          {dislikes > 0 && <span>{fmt(dislikes)}</span>}
        </button>
      </div>
      {pct !== null && (
        <div className="flex items-center gap-1.5">
          <div className="w-20 h-1 bg-yt-surface2 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-yt-muted">{pct}%</span>
        </div>
      )}
    </div>
  );
}
