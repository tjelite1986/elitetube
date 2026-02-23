"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Tag = { name: string; count: number };

export default function TagsAdminPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTag, setEditTag] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/tags");
    if (res.ok) setTags(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleRename(oldName: string) {
    if (!editName.trim() || editName.trim() === oldName) { setEditTag(null); return; }
    setBusy(true);
    const res = await fetch("/api/admin/tags", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldName, newName: editName.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      const { updated } = await res.json();
      setFeedback(`Bytte namn på "${oldName}" → "${editName.trim()}" (${updated} media)`);
      setEditTag(null);
      load();
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`Ta bort taggen "${name}" från alla adult-media?`)) return;
    setBusy(true);
    const res = await fetch("/api/admin/tags", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setBusy(false);
    if (res.ok) {
      const { updated } = await res.json();
      setFeedback(`Tog bort "${name}" från ${updated} media`);
      load();
    }
  }

  return (
    <div className="min-h-screen bg-yt-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-yt-muted hover:text-yt-text text-sm">← Admin</Link>
          <h1 className="text-2xl font-bold">Hantera adult-taggar</h1>
        </div>

        <p className="text-sm text-yt-muted mb-6">
          Taggar från adult-media visas som filterkategorier på 18+-sidan. Byt namn eller ta bort taggar du inte vill ha.
        </p>

        {feedback && (
          <div className="bg-yt-surface border border-yt-border rounded-lg px-4 py-2 text-sm text-green-400 mb-4">
            {feedback}
          </div>
        )}

        {loading ? (
          <p className="text-yt-muted text-sm">Laddar...</p>
        ) : tags.length === 0 ? (
          <p className="text-yt-muted text-sm">Inga taggar hittades i adult-media.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {tags.map((tag) => (
              <div
                key={tag.name}
                className="bg-yt-surface border border-yt-border rounded-xl px-4 py-3 flex items-center gap-3"
              >
                {editTag === tag.name ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(tag.name);
                        if (e.key === "Escape") setEditTag(null);
                      }}
                      autoFocus
                      className="flex-1 bg-yt-bg border border-blue-500 rounded-lg px-3 py-1.5 text-sm text-yt-text focus:outline-none"
                    />
                    <button
                      onClick={() => handleRename(tag.name)}
                      disabled={busy}
                      className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Spara
                    </button>
                    <button
                      onClick={() => setEditTag(null)}
                      className="text-xs text-yt-muted hover:text-yt-text transition-colors"
                    >
                      Avbryt
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-yt-text">{tag.name}</span>
                    <span className="text-xs text-yt-muted bg-yt-surface2 px-2 py-0.5 rounded-full">
                      {tag.count} media
                    </span>
                    <button
                      onClick={() => { setEditTag(tag.name); setEditName(tag.name); setFeedback(""); }}
                      className="text-xs text-yt-muted hover:text-blue-400 transition-colors"
                    >
                      Byt namn
                    </button>
                    <button
                      onClick={() => { setFeedback(""); handleDelete(tag.name); }}
                      disabled={busy}
                      className="text-xs text-yt-muted hover:text-red-400 disabled:opacity-50 transition-colors"
                    >
                      Ta bort
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
