"use client";
import { useEffect, useState, RefObject } from "react";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const STORAGE_KEY = "elitetube_speed";

export default function SpeedSelector({
  videoRef,
}: {
  videoRef: RefObject<HTMLVideoElement | HTMLAudioElement>;
}) {
  const [speed, setSpeed] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    return parseFloat(localStorage.getItem(STORAGE_KEY) ?? "1") || 1;
  });

  // Apply saved speed whenever the media element loads new src
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.playbackRate = speed;
    const onLoaded = () => { el.playbackRate = speed; };
    el.addEventListener("loadedmetadata", onLoaded);
    return () => el.removeEventListener("loadedmetadata", onLoaded);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef, speed]);

  const select = (s: number) => {
    setSpeed(s);
    localStorage.setItem(STORAGE_KEY, String(s));
    const el = videoRef.current;
    if (el) el.playbackRate = s;
  };

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      <span className="text-xs text-yt-muted mr-1">Speed</span>
      {SPEEDS.map((s) => (
        <button
          key={s}
          onClick={() => select(s)}
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
            speed === s
              ? "bg-white text-black"
              : "bg-yt-surface border border-yt-border text-yt-muted hover:text-yt-text hover:border-white/30"
          }`}
        >
          {s === 1 ? "1×" : `${s}×`}
        </button>
      ))}
    </div>
  );
}
