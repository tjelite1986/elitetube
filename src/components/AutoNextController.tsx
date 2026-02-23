"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  nextUrl: string | null;
  mediaType: string;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: {
          events: { onStateChange: (e: { data: number }) => void };
        }
      ) => void;
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function AutoNextController({ nextUrl, mediaType }: Props) {
  const router = useRouter();
  const navigated = useRef(false);

  function goNext() {
    if (!nextUrl || navigated.current) return;
    navigated.current = true;
    router.push(nextUrl);
  }

  useEffect(() => {
    if (!nextUrl) return;
    navigated.current = false;

    if (mediaType === "youtube") {
      // YouTube IFrame API — väntar tills iframen är redo
      const setupYT = () => {
        const iframe = document.querySelector("iframe");
        if (!iframe) return;

        new window.YT.Player(iframe as unknown as HTMLElement, {
          events: {
            onStateChange(e: { data: number }) {
              if (e.data === window.YT.PlayerState.ENDED) goNext();
            },
          },
        });
      };

      if (window.YT && window.YT.Player) {
        setupYT();
      } else {
        window.onYouTubeIframeAPIReady = setupYT;
        if (!document.getElementById("yt-iframe-api")) {
          const script = document.createElement("script");
          script.id = "yt-iframe-api";
          script.src = "https://www.youtube.com/iframe_api";
          document.head.appendChild(script);
        }
      }
    } else {
      // Lokal video / ljud
      const media = document.querySelector("video, audio");
      if (!media) return;

      const handler = () => goNext();
      media.addEventListener("ended", handler);
      return () => media.removeEventListener("ended", handler);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextUrl, mediaType]);

  return null;
}
