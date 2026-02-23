"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPlaylistForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
    });
    setLoading(false);
    if (res.ok) {
      setName("");
      setDescription("");
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          + Ny playlist
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-end gap-2 flex-wrap">
          <div className="flex flex-col gap-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Playlistnamn *"
              className="bg-yt-surface border border-yt-border rounded-lg px-3 py-1.5 text-sm text-yt-text placeholder-yt-muted focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskrivning (valfri)"
              className="bg-yt-surface border border-yt-border rounded-lg px-3 py-1.5 text-sm text-yt-text placeholder-yt-muted focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            {loading ? "Skapar..." : "Skapa"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 text-sm text-yt-muted hover:text-yt-text transition-colors"
          >
            Avbryt
          </button>
        </form>
      )}
    </div>
  );
}
