"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Source = {
  id: number;
  name: string;
  type: "local" | "smb" | "external_url";
  path?: string;
  description?: string;
};

export default function SourcesAdminPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [form, setForm] = useState({ name: "", type: "local", path: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/sources");
    if (res.status === 401) { router.push("/login"); return; }
    if (res.ok) setSources(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setForm({ name: "", type: "local", path: "", description: "" });
      load();
    } else {
      const d = await res.json();
      setError(d.error || "Fel");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this source?")) return;
    await fetch(`/api/sources?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="min-h-screen bg-yt-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-yt-muted hover:text-yt-text text-sm">← Admin</Link>
          <h1 className="text-2xl font-bold">Manage sources</h1>
        </div>

        {/* Add source */}
        <div className="bg-yt-surface border border-yt-border rounded-xl p-6 mb-8">
          <h2 className="font-semibold mb-4">Add source</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-yt-muted block mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Min NAS"
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
                  <option value="local">Local path</option>
                  <option value="smb">SMB/Network share</option>
                  <option value="external_url">External URL</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-yt-muted block mb-1">Path/URL</label>
              <input
                value={form.path}
                onChange={(e) => setForm({ ...form, path: e.target.value })}
                placeholder={form.type === "external_url" ? "https://..." : "/mnt/nas/videos"}
                className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-yt-muted block mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
                className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-yt-red hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium self-start transition-colors"
            >
              {loading ? "Saving..." : "Add"}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="flex flex-col gap-3">
          {sources.length === 0 ? (
            <p className="text-yt-muted text-sm">No sources added.</p>
          ) : (
            sources.map((s) => (
              <div key={s.id} className="bg-yt-surface border border-yt-border rounded-xl p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-yt-muted mt-0.5">
                    <span className="bg-yt-surface2 px-1.5 py-0.5 rounded mr-2">{s.type}</span>
                    {s.path && <span className="font-mono">{s.path}</span>}
                  </p>
                  {s.description && <p className="text-xs text-yt-muted mt-1">{s.description}</p>}
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-yt-muted hover:text-red-400 transition-colors shrink-0 text-sm"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
