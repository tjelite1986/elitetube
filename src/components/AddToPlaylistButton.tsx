"use client";
import { useState, useEffect, useRef } from "react";
import { PlaylistWithCount } from "@/lib/db";

export default function AddToPlaylistButton({ mediaId }: { mediaId: number }) {
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistWithCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<Record<number, "added" | "exists" | "error">>({});
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/playlists")
      .then((r) => r.json())
      .then((data) => {
        setPlaylists(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function addToPlaylist(playlistId: number) {
    const res = await fetch(`/api/playlists/${playlistId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media_id: mediaId }),
    });
    if (res.status === 201) {
      setFeedback((f) => ({ ...f, [playlistId]: "added" }));
    } else if (res.status === 200) {
      setFeedback((f) => ({ ...f, [playlistId]: "exists" }));
    } else {
      setFeedback((f) => ({ ...f, [playlistId]: "error" }));
    }
  }

  async function createAndAdd() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const pl = await res.json();
      await addToPlaylist(pl.id);
      setPlaylists((prev) => [{ ...pl, item_count: 1 }, ...prev]);
      setNewName("");
    }
    setCreating(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yt-surface border border-yt-border text-sm text-yt-text hover:bg-yt-hover transition-colors"
      >
        + Save to playlist
      </button>

      {open && (
        <div
          ref={modalRef}
          className="absolute top-full left-0 mt-1 w-72 bg-yt-surface border border-yt-border rounded-xl shadow-xl z-50 p-4"
        >
          <h3 className="text-sm font-semibold text-yt-text mb-3">Save to playlist</h3>

          {loading ? (
            <p className="text-xs text-yt-muted">Loading...</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto mb-3">
              {playlists.length === 0 && (
                <p className="text-xs text-yt-muted">No playlists — create one below.</p>
              )}
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => addToPlaylist(pl.id)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-yt-hover text-sm text-left transition-colors"
                >
                  <span className="text-yt-text truncate">{pl.name}</span>
                  <span className="text-xs text-yt-muted ml-2 shrink-0">
                    {feedback[pl.id] === "added"
                      ? "Added!"
                      : feedback[pl.id] === "exists"
                      ? "Already exists"
                      : feedback[pl.id] === "error"
                      ? "Error"
                      : `${pl.item_count} videos`}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-yt-border pt-3">
            <p className="text-xs text-yt-muted mb-1.5">Create new playlist</p>
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createAndAdd()}
                placeholder="Name..."
                className="flex-1 bg-yt-bg border border-yt-border rounded-lg px-2 py-1 text-sm text-yt-text placeholder-yt-muted focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={createAndAdd}
                disabled={creating || !newName.trim()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                {creating ? "..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
