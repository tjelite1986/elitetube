"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlaylistItemWithMedia } from "@/lib/db";
import { formatDuration } from "@/lib/media";

interface Props {
  items: PlaylistItemWithMedia[];
  currentItemId: number; // playlist_item_id of the currently playing item
  playlistId: number;
}

export default function PlaylistSidebar({ items, currentItemId, playlistId }: Props) {
  const router = useRouter();
  const [localItems, setLocalItems] = useState(items);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragIndex = useRef<number | null>(null);

  function handleShuffle() {
    const shuffled = [...localItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setLocalItems(shuffled);
    const order = shuffled.map((it) => it.playlist_item_id);
    fetch(`/api/playlists/${playlistId}/items`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    }).catch(() => {});
    router.push(`/playlists/${playlistId}?index=0`);
  }

  function handleRemove(playlistItemId: number) {
    const prev = localItems;
    setLocalItems(prev.filter((it) => it.playlist_item_id !== playlistItemId));
    fetch(`/api/playlists/${playlistId}/items/${playlistItemId}`, {
      method: "DELETE",
    }).catch(() => {
      setLocalItems(prev); // revert on network failure
    });
  }

  function onDragStart(e: React.DragEvent, index: number) {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overIndex !== index) setOverIndex(index);
  }

  function onDragEnd() {
    setOverIndex(null);
    dragIndex.current = null;
  }

  function onDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    setOverIndex(null);
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === dropIndex) return;

    const newItems = [...localItems];
    const [moved] = newItems.splice(from, 1);
    newItems.splice(dropIndex, 0, moved);
    setLocalItems(newItems);

    // Persist new order
    const order = newItems.map((item) => item.playlist_item_id);
    fetch(`/api/playlists/${playlistId}/items`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    }).catch(() => {
      setLocalItems(localItems); // revert on network failure
    });
  }

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto max-h-[80vh]">
      {/* Shuffle button */}
      <button
        onClick={handleShuffle}
        className="flex items-center gap-1.5 text-xs text-yt-muted hover:text-yt-text transition-colors px-2 py-1.5 rounded-lg hover:bg-yt-hover mb-0.5 self-start"
        title="Shuffle playlist"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <polyline points="16 3 21 3 21 8" />
          <line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21 16 21 21 16 21" />
          <line x1="15" y1="15" x2="21" y2="21" />
        </svg>
        Shuffle
      </button>

      {localItems.map((item, i) => {
        const isActive = item.playlist_item_id === currentItemId;
        const isDragTarget = overIndex === i && dragIndex.current !== null && dragIndex.current !== i;
        const href = `/watch/${item.id}?playlist=${playlistId}&index=${i}`;
        const thumb = item.thumbnail_url || "/placeholder-thumb.svg";

        return (
          <div
            key={item.playlist_item_id}
            draggable
            onDragStart={(e) => onDragStart(e, i)}
            onDragOver={(e) => onDragOver(e, i)}
            onDragEnd={onDragEnd}
            onDrop={(e) => onDrop(e, i)}
            className={`flex items-center gap-2 p-2 rounded-lg transition-colors group select-none ${
              isActive
                ? "bg-yt-hover border border-yt-border"
                : "hover:bg-yt-hover"
            } ${isDragTarget ? "ring-1 ring-blue-500 ring-inset bg-blue-900/10" : ""}`}
          >
            {/* Drag handle */}
            <div
              className="shrink-0 cursor-grab active:cursor-grabbing text-yt-muted opacity-0 group-hover:opacity-50 transition-opacity"
              title="Drag to reorder"
            >
              <svg viewBox="0 0 16 24" className="w-2.5 h-4 fill-current">
                <circle cx="4" cy="4" r="2" />
                <circle cx="12" cy="4" r="2" />
                <circle cx="4" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="4" cy="20" r="2" />
                <circle cx="12" cy="20" r="2" />
              </svg>
            </div>

            {/* Clickable link area */}
            <Link href={href} className="flex gap-2 flex-1 min-w-0">
              <div className="relative w-28 aspect-video bg-yt-surface rounded overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
                {item.duration && (
                  <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-xs px-1 rounded">
                    {formatDuration(item.duration)}
                  </span>
                )}
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-white text-lg">&#9654;</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium line-clamp-2 leading-snug ${isActive ? "text-white" : "text-yt-text"}`}>
                  {i + 1}. {item.title}
                </p>
                {item.category && (
                  <p className="text-xs text-yt-muted mt-0.5">{item.category}</p>
                )}
              </div>
            </Link>

            {/* Remove button */}
            <button
              onClick={(e) => { e.preventDefault(); handleRemove(item.playlist_item_id); }}
              className="shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 text-yt-muted hover:text-red-400 transition-opacity p-1 rounded"
              title="Remove from playlist"
              aria-label="Remove from playlist"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
