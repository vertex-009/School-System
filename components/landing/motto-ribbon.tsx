"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SCHOOL } from "./brand";

const ITEMS = [SCHOOL.motto, SCHOOL.city, SCHOOL.shortName, "Staff Platform"] as const;

/** Classical infinite motto ribbon between hero and roles. */
export function MottoRibbon() {
  const reduce = useReducedMotion();
  const loop = [...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <div
      aria-hidden
      className="relative overflow-hidden border-y border-brand-navy/10 bg-brand-soft/60 py-3.5"
    >
      <motion.div
        className="flex w-max items-center gap-8 whitespace-nowrap px-4 font-ui text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-accent/80"
        animate={reduce ? undefined : { x: ["0%", "-33.333%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        {loop.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-8">
            <span>{item}</span>
            <span className="h-1 w-1 rounded-full bg-brand-sky/70" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}
