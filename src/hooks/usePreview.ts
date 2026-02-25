import { useRef, useState } from "react";

/**
 * Handles hover-preview for both desktop (mouseenter/mouseleave)
 * and mobile (long-press 600ms + touchmove cancel).
 *
 * Usage:
 *   const { videoRef, active, thumbHandlers } = usePreview(previewUrl);
 *   <div {...thumbHandlers}>  ← put on the thumbnail wrapper div
 *     <video ref={videoRef} ... />
 *   </div>
 */
export function usePreview(previewUrl: string | null) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const blockNextClick = useRef(false);
  const [active, setActive] = useState(false);

  function start() {
    setActive(true);
    videoRef.current?.play().catch(() => {});
  }

  function stop() {
    setActive(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  /* ── Desktop ── */
  function onMouseEnter() {
    if (!previewUrl) return;
    hoverTimer.current = setTimeout(start, 400);
  }

  function onMouseLeave() {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    stop();
  }

  /* ── Mobile long-press ── */
  function onTouchStart(e: React.TouchEvent) {
    if (!previewUrl) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    longPressTimer.current = setTimeout(() => {
      start();
      blockNextClick.current = true; // block the synthetic click that fires after touchend
    }, 600);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!longPressTimer.current || !touchStart.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStart.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStart.current.y);
    if (dx > 10 || dy > 10) {
      // Finger moved — user is scrolling, cancel long press
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function onTouchEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // If long press fired and preview is active, leave it showing.
    // The next tap will be a normal click → Link navigates.
  }

  function onClick(e: React.MouseEvent) {
    if (blockNextClick.current) {
      // Long press just fired — block navigation, keep preview visible.
      // User must tap again to navigate.
      e.stopPropagation();
      blockNextClick.current = false;
    }
  }

  return {
    videoRef,
    active,
    thumbHandlers: { onMouseEnter, onMouseLeave, onTouchStart, onTouchMove, onTouchEnd, onClick },
  };
}
