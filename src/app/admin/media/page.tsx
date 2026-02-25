"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type MediaItem = {
  id: number;
  title: string;
  description?: string;
  type: string;
  url?: string;
  filename?: string;
  thumbnail_url?: string;
  duration?: number;
  category?: string;
  views: number;
  created_at: string;
  needs_ytdlp?: number;
  is_adult?: number;
};

type Source = {
  id: number;
  name: string;
  type: string;
};

const EMPTY_FORM = {
  title: "",
  description: "",
  type: "video",
  source_id: "",
  filename: "",
  url: "",
  thumbnail_url: "",
  duration: "",
  category: "",
  tags: "",
  needs_ytdlp: false,
  is_adult: false,
};

export default function MediaAdminPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [metaError, setMetaError] = useState("");
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editFetchingMeta, setEditFetchingMeta] = useState(false);
  const [editMetaError, setEditMetaError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkFetching, setBulkFetching] = useState(false);
  const [bulkProgress, setBulkProgress] = useState("");
  const router = useRouter();

  async function load() {
    const [mRes, sRes] = await Promise.all([
      fetch("/api/media?limit=200"),
      fetch("/api/sources"),
    ]);
    if (mRes.status === 401) { router.push("/login"); return; }
    if (mRes.ok) {
      const d = await mRes.json();
      setItems(d.items || []);
    }
    if (sRes.ok) setSources(await sRes.json());
  }

  useEffect(() => { load(); }, []);

  async function handleFetchMeta() {
    if (!form.url) return;
    setFetchingMeta(true);
    setMetaError("");
    const res = await fetch("/api/ytdlp/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: form.url }),
    });
    setFetchingMeta(false);
    if (res.ok) {
      const meta = await res.json();
      setForm((prev) => ({
        ...prev,
        title: meta.title || prev.title,
        thumbnail_url: meta.thumbnail || prev.thumbnail_url,
        duration: meta.duration ? String(Math.round(meta.duration)) : prev.duration,
        description: meta.description || prev.description,
        tags: meta.tags?.length ? meta.tags.join(", ") : prev.tags,
        needs_ytdlp: true,
      }));
    } else {
      const d = await res.json();
      setMetaError(d.error || "Could not fetch metadata");
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = {
      ...form,
      source_id: form.source_id ? parseInt(form.source_id) : undefined,
      duration: form.duration ? parseInt(form.duration) : undefined,
      needs_ytdlp: form.needs_ytdlp ? 1 : 0,
      is_adult: form.is_adult ? 1 : 0,
    };

    const res = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
      setForm(EMPTY_FORM);
      load();
    } else {
      const d = await res.json();
      setError(d.error || "Fel");
    }
  }

  async function handleEditFetchMeta() {
    if (!editForm.url) return;
    setEditFetchingMeta(true);
    setEditMetaError("");
    const res = await fetch("/api/ytdlp/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: editForm.url }),
    });
    setEditFetchingMeta(false);
    if (res.ok) {
      const meta = await res.json();
      setEditForm((prev) => ({
        ...prev,
        title: meta.title || prev.title,
        thumbnail_url: meta.thumbnail || prev.thumbnail_url,
        duration: meta.duration ? String(Math.round(meta.duration)) : prev.duration,
        description: meta.description || prev.description,
        tags: meta.tags?.length ? meta.tags.join(", ") : prev.tags,
      }));
    } else {
      const d = await res.json();
      setEditMetaError(d.error || "Could not fetch metadata");
    }
  }

  function openEdit(item: MediaItem) {
    setEditItem(item);
    setEditError("");
    setEditMetaError("");
    setEditForm({
      title: item.title,
      description: item.description || "",
      type: item.type,
      source_id: "",
      filename: item.filename || "",
      url: item.url || "",
      thumbnail_url: item.thumbnail_url || "",
      duration: item.duration ? String(item.duration) : "",
      category: item.category || "",
      tags: (item as MediaItem & { tags?: string }).tags || "",
      needs_ytdlp: !!item.needs_ytdlp,
      is_adult: !!item.is_adult,
    });
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setEditLoading(true);
    setEditError("");

    const body = {
      ...editForm,
      duration: editForm.duration ? parseInt(editForm.duration) : undefined,
      needs_ytdlp: editForm.needs_ytdlp ? 1 : 0,
      is_adult: editForm.is_adult ? 1 : 0,
    };

    const res = await fetch(`/api/media/${editItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setEditLoading(false);

    if (res.ok) {
      setEditItem(null);
      load();
    } else {
      const d = await res.json();
      setEditError(d.error || "Fel");
    }
  }

  async function handleBulkFetchMeta() {
    const targets = filtered.filter((i) => selectedIds.has(i.id) && i.url);
    if (targets.length === 0) return;
    setBulkFetching(true);
    setBulkProgress(`0 / ${targets.length}`);
    let done = 0;
    for (const item of targets) {
      try {
        const infoRes = await fetch("/api/ytdlp/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: item.url }),
        });
        if (infoRes.ok) {
          const meta = await infoRes.json();
          await fetch(`/api/media/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: meta.title || item.title,
              thumbnail_url: meta.thumbnail || item.thumbnail_url || "",
              duration: meta.duration ? Math.round(meta.duration) : item.duration,
              description: meta.description || item.description || "",
              tags: meta.tags?.length ? meta.tags.join(", ") : (item as MediaItem & { tags?: string }).tags || "",
              needs_ytdlp: 1,
              type: item.type,
              category: item.category || "",
              url: item.url || "",
              filename: item.filename || "",
              is_adult: item.is_adult || 0,
            }),
          });
        }
      } catch { /* continue on error */ }
      done++;
      setBulkProgress(`${done} / ${targets.length}`);
    }
    setBulkFetching(false);
    setBulkProgress("");
    setSelectedIds(new Set());
    load();
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedIds.size} selected items? This cannot be undone.`)) return;
    await Promise.all(
      Array.from(selectedIds).map((id) => fetch(`/api/media/${id}`, { method: "DELETE" }))
    );
    setSelectedIds(new Set());
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this media item?")) return;
    await fetch(`/api/media/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const filtered = items.filter(
    (i) =>
      !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      (i.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-yt-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-yt-muted hover:text-yt-text text-sm">← Admin</Link>
          <h1 className="text-2xl font-bold">Manage media</h1>
        </div>

        {/* Add media */}
        <div className="bg-yt-surface border border-yt-border rounded-xl p-6 mb-8">
          <h2 className="font-semibold mb-4">Add media</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-yt-muted block mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="My video"
                  className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-yt-muted block mb-1">Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="image">Image</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-yt-muted block mb-1">URL (YouTube, Vimeo, Rumble etc.)</label>
                <div className="flex gap-2">
                  <input
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value, needs_ytdlp: false })}
                    placeholder="https://vimeo.com/..."
                    className="flex-1 bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleFetchMeta}
                    disabled={fetchingMeta || !form.url}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
                  >
                    {fetchingMeta ? "Fetching..." : "Fetch info"}
                  </button>
                </div>
                {form.needs_ytdlp && (
                  <p className="text-green-400 text-xs mt-1">Metadata fetched — played via yt-dlp</p>
                )}
                {metaError && (
                  <p className="text-red-400 text-xs mt-1">{metaError}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-yt-muted block mb-1">Local file (relative path)</label>
                <input
                  value={form.filename}
                  onChange={(e) => setForm({ ...form, filename: e.target.value })}
                  placeholder="films/movie.mp4"
                  className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-yt-muted block mb-1">Source</label>
                <select
                  value={form.source_id}
                  onChange={(e) => setForm({ ...form, source_id: e.target.value })}
                  className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">— none —</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-yt-muted block mb-1">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Movies, Music..."
                  className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-yt-muted block mb-1">Duration (seconds)</label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="3600"
                  className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-yt-muted block mb-1">Tags (comma-separated)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="tag1, tag2, tag3"
                className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-yt-muted mt-1">Auto-filled when using &quot;Fetch info&quot;</p>
            </div>

            <div>
              <label className="text-xs text-yt-muted block mb-1">Thumbnail URL (auto for YouTube)</label>
              <input
                value={form.thumbnail_url}
                onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                placeholder="https://..."
                className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-yt-muted block mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Optional description..."
                className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                checked={form.is_adult}
                onChange={(e) => setForm({ ...form, is_adult: e.target.checked })}
                className="w-4 h-4 accent-red-600"
              />
              <span className="text-sm text-yt-text">
                Adult content (18+)
                <span className="ml-1 text-xs text-yt-muted">— requires PIN to play</span>
              </span>
            </label>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-yt-red hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium self-start transition-colors"
            >
              {loading ? "Saving..." : "Add media"}
            </button>
          </form>
        </div>

        {/* Search + list */}
        <div className="mb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter media..."
            className="w-full bg-yt-surface border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Bulk controls */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <button
              onClick={() => {
                if (selectedIds.size === filtered.length) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(filtered.map((i) => i.id)));
                }
              }}
              className="text-xs text-yt-muted hover:text-yt-text transition-colors"
            >
              {selectedIds.size === filtered.length ? "Deselect all" : "Select all"}
            </button>
            <button
              onClick={() => {
                const withoutThumb = filtered.filter((i) => !i.thumbnail_url);
                setSelectedIds(new Set(withoutThumb.map((i) => i.id)));
              }}
              className="text-xs text-yt-muted hover:text-yt-text transition-colors"
            >
              Select missing info ({filtered.filter((i) => !i.thumbnail_url).length})
            </button>
            {selectedIds.size > 0 && !bulkFetching && (
              <span className="text-xs text-yt-muted">{selectedIds.size} selected</span>
            )}
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkFetchMeta}
                disabled={bulkFetching}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                {bulkFetching
                  ? `Fetching info... ${bulkProgress}`
                  : `Fetch info for ${selectedIds.size}`}
              </button>
            )}
            {selectedIds.size > 0 && !bulkFetching && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                Delete {selectedIds.size}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <p className="text-yt-muted text-sm">No media found.</p>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`bg-yt-surface border rounded-xl px-4 py-3 flex items-center gap-3 ${
                  selectedIds.has(item.id) ? "border-blue-500" : "border-yt-border"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={(e) => {
                    const next = new Set(selectedIds);
                    e.target.checked ? next.add(item.id) : next.delete(item.id);
                    setSelectedIds(next);
                  }}
                  className="w-4 h-4 accent-blue-500 shrink-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-yt-surface2 px-1.5 py-0.5 rounded uppercase text-yt-muted">
                      {item.type}
                    </span>
                    {item.is_adult === 1 && (
                      <span className="text-xs bg-red-700 text-white px-1.5 py-0.5 rounded font-bold">18+</span>
                    )}
                    <p className="text-sm font-medium text-yt-text truncate">{item.title}</p>
                  </div>
                  <p className="text-xs text-yt-muted mt-0.5">
                    {item.category && <span className="mr-2">{item.category}</span>}
                    <span>{item.views} views</span>
                    {item.url && <span className="ml-2 font-mono truncate hidden sm:inline">{item.url.slice(0, 50)}...</span>}
                    {item.filename && <span className="ml-2 font-mono truncate hidden sm:inline">{item.filename}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/watch/${item.id}`}
                    className="text-xs text-yt-muted hover:text-yt-text transition-colors"
                  >
                    Play
                  </Link>
                  <button
                    onClick={() => openEdit(item)}
                    className="text-xs text-yt-muted hover:text-blue-400 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-xs text-yt-muted hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-yt-surface border border-yt-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">Edit media</h2>
              <button
                onClick={() => setEditItem(null)}
                className="text-yt-muted hover:text-yt-text text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSave} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-yt-muted block mb-1">Title *</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                  className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-yt-muted block mb-1">Type *</label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="image">Image</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-yt-muted block mb-1">URL</label>
                <div className="flex gap-2">
                  <input
                    value={editForm.url}
                    onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleEditFetchMeta}
                    disabled={editFetchingMeta || !editForm.url}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
                  >
                    {editFetchingMeta ? "Fetching..." : "Fetch info"}
                  </button>
                </div>
                {editMetaError && (
                  <p className="text-red-400 text-xs mt-1">{editMetaError}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-yt-muted block mb-1">Local file</label>
                <input
                  value={editForm.filename}
                  onChange={(e) => setEditForm({ ...editForm, filename: e.target.value })}
                  placeholder="films/movie.mp4"
                  className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-yt-muted block mb-1">Category</label>
                  <input
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    placeholder="Movies, Music..."
                    className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-yt-muted block mb-1">Duration (seconds)</label>
                  <input
                    type="number"
                    value={editForm.duration}
                    onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                    placeholder="3600"
                    className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-yt-muted block mb-1">Tags (comma-separated)</label>
                <input
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                  className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-yt-muted block mb-1">Thumbnail URL</label>
                <input
                  value={editForm.thumbnail_url}
                  onChange={(e) => setEditForm({ ...editForm, thumbnail_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-yt-muted block mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                  <input
                    type="checkbox"
                    checked={editForm.needs_ytdlp}
                    onChange={(e) => setEditForm({ ...editForm, needs_ytdlp: e.target.checked })}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-yt-text">Played via yt-dlp</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                  <input
                    type="checkbox"
                    checked={editForm.is_adult}
                    onChange={(e) => setEditForm({ ...editForm, is_adult: e.target.checked })}
                    className="w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm text-yt-text">Adult content (18+)</span>
                </label>
              </div>

              {editError && <p className="text-red-400 text-sm">{editError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {editLoading ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="bg-yt-bg hover:bg-yt-hover border border-yt-border text-yt-text px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
