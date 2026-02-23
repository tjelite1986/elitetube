"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdultPinGate() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/adult/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    setLoading(false);

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Fel PIN");
      setPin("");
    }
  }

  function handleKeypad(digit: string) {
    if (pin.length < 8) setPin((prev) => prev + digit);
  }

  function handleBackspace() {
    setPin((prev) => prev.slice(0, -1));
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-yt-surface border border-yt-border rounded-2xl p-8 w-full max-w-sm text-center">
        <div className="text-4xl mb-4">🔞</div>
        <h2 className="text-xl font-bold text-yt-text mb-1">Åldersverifiering</h2>
        <p className="text-sm text-yt-muted mb-6">
          Det här innehållet är märkt som 18+. Ange PIN-koden för att fortsätta.
        </p>

        {/* PIN-visning */}
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: Math.max(pin.length, 4) }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 ${
                i < pin.length ? "bg-yt-red border-yt-red" : "border-yt-border bg-transparent"
              }`}
            />
          ))}
        </div>

        {/* Nummerpad */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleKeypad(d)}
                className="bg-yt-bg hover:bg-yt-hover border border-yt-border rounded-xl py-3 text-lg font-semibold text-yt-text transition-colors"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className="bg-yt-bg hover:bg-yt-hover border border-yt-border rounded-xl py-3 text-sm text-yt-muted transition-colors"
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={() => handleKeypad("0")}
              className="bg-yt-bg hover:bg-yt-hover border border-yt-border rounded-xl py-3 text-lg font-semibold text-yt-text transition-colors"
            >
              0
            </button>
            <button
              type="submit"
              disabled={pin.length < 4 || loading}
              className="bg-yt-red hover:bg-red-700 disabled:opacity-40 rounded-xl py-3 text-sm font-semibold text-white transition-colors"
            >
              {loading ? "..." : "OK"}
            </button>
          </div>
        </form>

        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
