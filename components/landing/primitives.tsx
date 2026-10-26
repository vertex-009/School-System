"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, type Variants } from "framer-motion";
import { SCHOOL } from "./brand";

/** One easing curve for the whole page keeps motion feeling like a single system. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

/** Section reveal: fades and lifts children into place once, as they scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "p" | "h2";
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      variants={revealVariants}
      transition={{ delay }}
    >
      {children}
    </Tag>
  );
}

/** Tracked uppercase micro-label used above section headlines. */
export function Eyebrow({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "light" }) {
  return (
    <p
      className={`font-ui text-[11px] font-semibold uppercase tracking-[0.32em] ${
        tone === "light" ? "text-brand-sky" : "text-brand-accent"
      }`}
    >
      {children}
    </p>
  );
}

/**
 * School crest.
 * Uses the real crest at `/school-logo.jpg` (SCHOOL.logoSrc). If the file is ever missing,
 * replace this <Image> with a CPSC monogram — keep the round frame so layouts don't shift.
 */
export function Crest({ size = 40, priority = false, className = "" }: { size?: number; priority?: boolean; className?: string }) {
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-brand-navy ring-1 ring-white/20 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image src={SCHOOL.logoSrc} alt={`${SCHOOL.fullName} crest`} fill sizes={`${size}px`} className="object-cover" priority={priority} />
    </span>
  );
}

const MotionLink = motion.create(Link);

/**
 * Primary CTA: a gentle magnetic pull toward the pointer, a press-down on tap,
 * and a shimmer that runs along the edge on hover. All of it switches off under reduced motion.
 */
export function MagneticCta({
  href,
  children,
  size = "md",
  tone = "sky",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  size?: "md" | "lg";
  tone?: "sky" | "navy";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 });

  function onMove(e: React.PointerEvent) {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.22);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.3);
  }
  function reset() {
    x.set(0);
    y.set(0);
  }

  const sizing = size === "lg" ? "h-14 px-8 text-base sm:h-16 sm:px-10" : "h-12 px-6 text-[15px]";
  const colors =
    tone === "sky"
      ? "bg-brand-sky text-brand-deep shadow-[0_10px_30px_-10px_rgba(93,173,226,0.7)] hover:shadow-[0_18px_40px_-12px_rgba(93,173,226,0.85)]"
      : "bg-brand-navy text-white shadow-[0_10px_30px_-12px_rgba(11,31,58,0.6)] hover:bg-brand-accent";

  return (
    <MotionLink
      ref={ref}
      href={href}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x, y }}
      whileTap={{ scale: 0.97 }}
      className={`cta-shimmer group inline-flex items-center justify-center gap-2.5 rounded-full font-ui font-semibold tracking-[-0.01em] transition-[background-color,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy ${sizing} ${colors} ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </MotionLink>
  );
}

export function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
