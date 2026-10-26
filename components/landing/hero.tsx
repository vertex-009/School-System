"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue, type Variants } from "framer-motion";
import { SCHOOL } from "./brand";
import { ArrowRight, Crest, EASE, MagneticCta } from "./primitives";

// Load sequence: nav (0s) → brand → headline → CTAs → atmosphere settles in last.
const sequence: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
};
const maskLine: Variants = {
  hidden: { y: "150%" },
  show: { y: "0%", transition: { duration: 1.15, ease: EASE } },
};

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Parallax depth: far layers move slowest, content drifts up and fades as you leave.
  const raysY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 160]);
  const archY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const latticeY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 40]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, reduce ? 1 : 0]);

  return (
    <section
      ref={ref}
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[88svh] items-end overflow-hidden bg-brand-deep pb-12 pt-28 sm:items-center sm:pb-16"
    >
      <Atmosphere raysY={raysY} archY={archY} latticeY={latticeY} drift={!reduce} />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8"
      >
        <motion.div variants={sequence} initial="hidden" animate="show">
          <motion.div variants={rise} className="flex items-center gap-4">
            <Crest size={56} priority className="ring-2 ring-white/15 shadow-[0_0_0_8px_rgba(93,173,226,0.06)]" />
            <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.34em] text-brand-sky">
              Staff Platform{" "}
              <span className="whitespace-nowrap">
                <span className="mx-2 text-white/30">/</span> {SCHOOL.city}
              </span>
            </p>
          </motion.div>

          <h1 id="hero-title" className="mt-8 font-display font-normal leading-[0.9] tracking-[-0.035em] text-white">
            {/* Masks carry the font size so their em padding leaves room for descenders (y, g) and the italic swash. */}
            <span className="-mb-[0.14em] block overflow-hidden pb-[0.14em] text-[clamp(3.1rem,9.6vw,8rem)]">
              <motion.span variants={maskLine} className="block">
                City Public School
              </motion.span>
            </span>
            <span className="-mx-[0.12em] -mb-[0.24em] block overflow-hidden px-[0.12em] pb-[0.3em] text-[clamp(2.5rem,7.6vw,6.5rem)]">
              <motion.span
                variants={maskLine}
                className="block italic text-brand-sky [font-variation-settings:'opsz'_144]"
              >
                &amp; College
              </motion.span>
            </span>
          </h1>

          <motion.p
            variants={rise}
            className="mt-8 max-w-2xl font-ui text-[clamp(1.2rem,2.3vw,1.7rem)] font-medium leading-snug tracking-[-0.015em] text-white"
          >
            Where academics, finance, and classrooms run as one.
          </motion.p>

          <motion.p variants={rise} className="mt-4 max-w-xl font-ui text-base leading-relaxed text-slate-300/90 sm:text-[17px]">
            The private staff platform behind the Principal&rsquo;s school-wide oversight, the Finance office&rsquo;s fees and
            salaries, and every teacher&rsquo;s classroom day.
          </motion.p>

          <motion.div variants={rise} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <MagneticCta href="/login" className="w-full sm:w-auto">
              Staff Sign In
            </MagneticCta>
            <a
              href="#roles"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 font-ui text-[15px] font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/[0.06] hover:ring-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky"
            >
              Explore roles
              <ArrowRight className="h-4 w-4 rotate-90 transition-transform duration-300 group-hover:translate-y-0.5" />
            </a>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Hairline + soft mist fade into the next section */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-brand-sky/40 to-transparent" />
    </section>
  );
}

type MV = MotionValue<number>;

/** Deep navy academic canvas: light rays, a slow-turning astrolabe ring, colonnade arches and a fading lattice. */
function Atmosphere({ raysY, archY, latticeY, drift }: { raysY: MV; archY: MV; latticeY: MV; drift: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.8, delay: 0.7, ease: EASE }}
    >
      {/* Base gradient: deep navy → navy → accent */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_80%_0%,#1a5276_0%,#0b1f3a_45%,#071528_100%)]" />

      {/* Light rays from the upper right — "Education is light" */}
      <motion.div style={{ y: raysY }} className="absolute -right-[10%] -top-[20%] h-[140%] w-[80%]">
        <motion.div
          className="absolute inset-0 origin-top-right"
          animate={drift ? { rotate: [0, 2.5, 0], opacity: [0.85, 1, 0.85] } : undefined}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        >
          {[
            { r: 28, w: 9, o: 0.16 },
            { r: 36, w: 4, o: 0.12 },
            { r: 44, w: 14, o: 0.1 },
            { r: 54, w: 5, o: 0.08 },
          ].map((ray) => (
            <span
              key={ray.r}
              className="absolute right-[12%] top-0 h-full origin-top blur-2xl"
              style={{
                width: `${ray.w}%`,
                transform: `rotate(${ray.r}deg)`,
                background: `linear-gradient(to bottom, rgba(93,173,226,${ray.o * 2.2}), rgba(93,173,226,0) 75%)`,
              }}
            />
          ))}
        </motion.div>
        <div className="absolute right-[8%] top-[10%] h-72 w-72 rounded-full bg-brand-sky/20 blur-[100px]" />
      </motion.div>

      {/* Fine lattice grid, fading toward the edges */}
      <motion.div
        style={{ y: latticeY }}
        className="absolute inset-0 opacity-[0.22] [mask-image:radial-gradient(70%_60%_at_70%_55%,#000_10%,transparent_75%)]"
      >
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="lattice" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M56 0H0V56" fill="none" stroke="#5dade2" strokeWidth="0.5" strokeOpacity="0.55" />
              <circle cx="0" cy="0" r="1.1" fill="#5dade2" fillOpacity="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lattice)" />
        </svg>
      </motion.div>

      {/* Astrolabe ring — concentric circles with graduation ticks, turning very slowly */}
      <motion.div style={{ y: archY }} className="absolute -right-40 top-[8%] h-[46rem] w-[46rem] opacity-40 sm:-right-24 lg:right-[-6rem]">
        <motion.svg
          viewBox="0 0 400 400"
          className="h-full w-full"
          animate={drift ? { rotate: 360 } : undefined}
          transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
        >
          <g fill="none" stroke="#5dade2">
            <circle cx="200" cy="200" r="196" strokeOpacity="0.25" strokeWidth="0.6" />
            <circle cx="200" cy="200" r="168" strokeOpacity="0.35" strokeWidth="0.6" strokeDasharray="1 5" />
            <circle cx="200" cy="200" r="120" strokeOpacity="0.2" strokeWidth="0.6" />
            {Array.from({ length: 72 }).map((_, i) => {
              const a = (i * 5 * Math.PI) / 180;
              const long = i % 6 === 0;
              const r1 = long ? 178 : 186;
              // Rounded so server and client render identical attribute strings (avoids hydration mismatch).
              const p = (n: number) => Math.round(n * 100) / 100;
              return (
                <line
                  key={i}
                  x1={p(200 + Math.cos(a) * r1)}
                  y1={p(200 + Math.sin(a) * r1)}
                  x2={p(200 + Math.cos(a) * 196)}
                  y2={p(200 + Math.sin(a) * 196)}
                  strokeOpacity={long ? 0.6 : 0.3}
                  strokeWidth="0.6"
                />
              );
            })}
            <path d="M200 4 L200 396 M4 200 L396 200" strokeOpacity="0.12" strokeWidth="0.5" />
          </g>
        </motion.svg>
      </motion.div>

      {/* Colonnade of arched windows — abstract campus architecture, rising from the horizon */}
      <motion.div style={{ y: archY }} className="absolute bottom-0 right-0 hidden w-[62%] max-w-[900px] sm:block">
        <svg viewBox="0 0 900 420" className="w-full" fill="none">
          <defs>
            <linearGradient id="arch-stroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5dade2" stopOpacity="0.55" />
              <stop offset="1" stopColor="#5dade2" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="arch-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5dade2" stopOpacity="0.09" />
              <stop offset="1" stopColor="#5dade2" stopOpacity="0" />
            </linearGradient>
          </defs>
          {Array.from({ length: 7 }).map((_, i) => {
            const x = 40 + i * 122;
            const top = 60 + Math.abs(3 - i) * 26;
            return (
              <g key={i}>
                <path
                  d={`M${x} 420 V${top + 50} A50 50 0 0 1 ${x + 100} ${top + 50} V420`}
                  stroke="url(#arch-stroke)"
                  strokeWidth="1"
                  fill={i === 3 ? "url(#arch-fill)" : "none"}
                />
                <path d={`M${x + 50} ${top} V420`} stroke="url(#arch-stroke)" strokeWidth="0.5" strokeOpacity="0.5" />
              </g>
            );
          })}
        </svg>
      </motion.div>

      {/* Horizon glow and vignette for legibility on the left */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-deep via-brand-deep/60 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-brand-deep/80 to-transparent" />
    </motion.div>
  );
}
