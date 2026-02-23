"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Felaktigt användarnamn eller lösenord");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-yt-bg flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <span className="text-yt-red font-bold text-5xl leading-none">▶</span>
        <span className="text-yt-text font-bold text-4xl">EliteTube</span>
      </div>

      {/* Form */}
      <div className="bg-yt-surface border border-yt-border rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <h1 className="text-xl font-medium text-yt-text mb-6">Logga in</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-yt-muted mb-1">Användarnamn</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2.5 text-sm text-yt-text placeholder-yt-muted focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-sm text-yt-muted mb-1">Lösenord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2.5 text-sm text-yt-text placeholder-yt-muted focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yt-red hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors mt-2"
          >
            {loading ? "Loggar in..." : "Logga in"}
          </button>
        </form>
      </div>

      <p className="text-yt-muted text-xs mt-6">Privat mediaserver — obehörig åtkomst förbjuden</p>
    </div>
  );
}
