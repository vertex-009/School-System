"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin animated progress bar at the very top of the viewport.
 * Shows during Next.js navigations (route changes) to give instant feedback,
 * eliminating the perceived "freeze" when switching sidebar modules.
 *
 * How it works:
 * - On route change START: bar appears and animates from 0→90% (fast cubic ease).
 * - On route change END (pathname changes): bar snaps to 100% → fades out.
 * - If prefetch cache serves the page instantly, the bar barely flickers (or doesn't show at all).
 */
export function TopLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathRef = useRef(pathname);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Listen for navigation START via click on links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element)?.closest?.("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;
      // Same page
      if (href === pathname || href === pathname + "/") return;

      // Start progress
      cleanup();
      setProgress(13);
      setVisible(true);

      // Animate to ~90% over 800ms
      let start: number | null = null;
      const animate = (ts: number) => {
        if (!start) start = ts;
        const elapsed = ts - start;
        // Ease-out: fast start, slow end — reaches ~90% by 800ms
        const t = Math.min(elapsed / 1200, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setProgress(13 + eased * 77); // 13% → 90%
        if (t < 1) rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      cleanup();
    };
  }, [pathname, cleanup]);

  // On pathname change (navigation COMPLETE): finish bar → hide
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      cleanup();
      setProgress(100);
      setVisible(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
    }
  }, [pathname, cleanup]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2.5px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease" }}
    >
      <div
        className="h-full bg-gradient-to-r from-[#1a8cff] via-[#5dade2] to-[#1a8cff] shadow-[0_0_10px_rgba(26,140,255,0.5)]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? "width 150ms ease-out" : "none",
          borderRadius: "0 2px 2px 0",
        }}
      />
    </div>
  );
}

