// On-screen display overlay shown briefly when a keyboard shortcut fires
export default function PlayerOsd({ text }: { text: string | null }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none z-20 transition-opacity duration-300 ${
        text ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="bg-black/70 text-white text-xl font-semibold px-5 py-2.5 rounded-2xl">
        {text ?? ""}
      </span>
    </div>
  );
}
