"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { SCHOOL } from "./brand";
import { EASE, Eyebrow, Reveal } from "./primitives";

/** Full-bleed campus moment — classical motto over the school grounds. */
export function Campus() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : -48, reduce ? 0 : 48]);
  const veil = useTransform(scrollYProgress, [0, 0.45, 1], [0.55, 0.72, 0.85]);

  return (
    <section
      id="campus"
      ref={ref}
      aria-labelledby="campus-title"
      className="relative isolate min-h-[48svh] scroll-mt-28 overflow-hidden bg-brand-deep"
    >
      <motion.div style={{ y: imgY }} className="absolute inset-[-8%] -z-10">
        <Image
          src={SCHOOL.campusSrc}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority={false}
        />
      </motion.div>
      <motion.div aria-hidden style={{ opacity: veil }} className="absolute inset-0 -z-10 bg-brand-deep" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(70%_80%_at_50%_40%,transparent_0%,rgba(7,21,40,0.55)_100%)]"
      />

      <div className="relative mx-auto flex min-h-[48svh] max-w-5xl flex-col items-center justify-center px-5 py-16 text-center sm:px-8 sm:py-20">
        <Reveal>
          <Ornament />
        </Reveal>
        <Reveal delay={0.1}>
          <Eyebrow tone="light">{SCHOOL.city}</Eyebrow>
        </Reveal>
        <Reveal delay={0.18} as="h2">
          <span
            id="campus-title"
            className="mt-5 block font-display text-[clamp(2.4rem,6vw,4.5rem)] font-normal italic leading-[1.05] tracking-[-0.03em] text-white"
          >
            &ldquo;{SCHOOL.motto}&rdquo;
          </span>
        </Reveal>
        <Reveal delay={0.28} as="p">
          <span className="mt-6 block max-w-lg font-ui text-base leading-relaxed text-slate-300/90 sm:text-lg">
            A private staff platform for the classrooms, offices, and grounds of {SCHOOL.fullName}.
          </span>
        </Reveal>
        <Reveal delay={0.36}>
          <div className="mt-10">
            <Ornament />
          </div>
        </Reveal>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-sky/35 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-sky/35 to-transparent"
      />
    </section>
  );
}

function Ornament() {
  return (
    <motion.span
      aria-hidden
      className="mx-auto flex items-center gap-3 text-brand-sky/70"
      initial={{ opacity: 0, scaleX: 0.6 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: EASE }}
    >
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand-sky/60 sm:w-16" />
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
        <path d="M12 2.5 13.8 9H20l-5 3.6 1.9 6.4L12 15.8 7.1 19l1.9-6.4L4 9h6.2L12 2.5Z" />
      </svg>
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-brand-sky/60 sm:w-16" />
    </motion.span>
  );
}
