import { useEffect, useRef, useState } from "react";

function fmt(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function useVideoResume(key: string | number, active = true) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resumedFrom, setResumedFrom] = useState<string | null>(null);
  const storageKey = `elitetube_pos_${key}`;

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) return;

    const saved = parseFloat(localStorage.getItem(storageKey) ?? "0");

    const onLoaded = () => {
      if (saved > 10 && video.duration > 0 && saved < video.duration * 0.95) {
        video.currentTime = saved;
        setResumedFrom(fmt(saved));
        const t = setTimeout(() => setResumedFrom(null), 4000);
        return () => clearTimeout(t);
      }
    };

    let lastSaved = 0;
    const onTimeUpdate = () => {
      if (Math.abs(video.currentTime - lastSaved) >= 5) {
        localStorage.setItem(storageKey, String(Math.floor(video.currentTime)));
        lastSaved = video.currentTime;
      }
    };

    const onEnded = () => localStorage.removeItem(storageKey);

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, active]);

  return { videoRef, resumedFrom };
}
