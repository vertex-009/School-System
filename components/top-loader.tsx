"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * TopLoader: only displays if navigation takes LONGER than 400ms.
 * Fast, cached, or prefetched transitions show NO progress bar at all.
 */
export function TopLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathRef = useRef(pathname);
  const rafRef = useRef<number>(0);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPendingRef = useRef(false);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const startSlowAnimation = useCallback(() => {
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      // Smooth cubic ease from 20% up to 88% over 1000ms
      const t = Math.min(elapsed / 1000, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(20 + eased * 68);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  const triggerPendingNavigation = useCallback(() => {
    cleanup();
    isPendingRef.current = true;

    // Show ONLY if navigation takes longer than 400ms
    delayTimerRef.current = setTimeout(() => {
      if (isPendingRef.current) {
        setVisible(true);
        setProgress(20);
        startSlowAnimation();
      }
    }, 400);
  }, [cleanup, startSlowAnimation]);

  // Listen for navigation START via clicks on internal links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element)?.closest?.("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;
      // Ignore click to same page / anchor
      if (href === pathname || href === pathname + "/") return;

      triggerPendingNavigation();
    };

    const handlePopState = () => {
      triggerPendingNavigation();
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      cleanup();
    };
  }, [pathname, triggerPendingNavigation, cleanup]);

  // On pathname change (navigation COMPLETE):
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      isPendingRef.current = false;

      // Cancel the 400ms delay timer if it hasn't fired yet
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }

      // If the bar was displayed because the page took > 400ms, finish & fade out
      if (visible) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setProgress(100);
        hideTimerRef.current = setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 180);
      } else {
        // Fast navigation (< 400ms): keep bar completely hidden
        cleanup();
        setProgress(0);
        setVisible(false);
      }
    }
  }, [pathname, visible, cleanup]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2.5px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 150ms ease" }}
    >
      <div
        className="h-full bg-gradient-to-r from-[#1a8cff] via-[#5dade2] to-[#1a8cff] shadow-[0_0_10px_rgba(26,140,255,0.5)]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? "width 120ms ease-out" : "none",
          borderRadius: "0 2px 2px 0",
        }}
      />
    </div>
  );
}
