"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdultPinPage() {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/adult-pin")
      .then((r) => r.json())
      .then((d) => setHasPin(d.hasPin));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (pin.length < 4) {
      setError("PIN must be at least 4 characters");
      return;
    }
    if (pin !== confirm) {
      setError("PIN codes do not match");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/adult-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setLoading(false);

    if (res.ok) {
      setMessage(hasPin ? "PIN code updated" : "PIN code set");
      setHasPin(true);
      setPin("");
      setConfirm("");
    } else {
      const d = await res.json();
      setError(d.error || "Fel");
    }
  }

  return (
    <div className="min-h-screen bg-yt-bg">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-yt-muted hover:text-yt-text text-sm">← Admin</Link>
          <h1 className="text-2xl font-bold">Adult settings</h1>
        </div>

        <div className="bg-yt-surface border border-yt-border rounded-xl p-6">
          <div className="mb-4">
            <p className="text-sm text-yt-muted">
              The PIN code is required to play media marked as 18+.
              The PIN is valid per session (browser tab).
            </p>
            {hasPin !== null && (
              <p className="text-xs mt-2">
                Status:{" "}
                <span className={hasPin ? "text-green-400" : "text-yellow-400"}>
                  {hasPin ? "PIN is set" : "No PIN set — adult content is inaccessible"}
                </span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-yt-muted block mb-1">
                {hasPin ? "New PIN code" : "PIN code"} (at least 4 characters)
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                minLength={4}
                placeholder="••••"
                autoComplete="new-password"
                className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-yt-muted block mb-1">Confirm PIN code</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••"
                autoComplete="new-password"
                className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {message && <p className="text-green-400 text-sm">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-yt-red hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium self-start transition-colors"
            >
              {loading ? "Saving..." : hasPin ? "Update PIN" : "Set PIN"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
