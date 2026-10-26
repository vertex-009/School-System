"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/** Thin sky progress line pinned under the floating nav. */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-brand-sky"
      style={{ scaleX }}
    />
  );
}
