"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { SCHOOL } from "./brand";
import { Crest, EASE, MagneticCta } from "./primitives";

const LINKS = [
  { href: "#roles", label: "Roles" },
  { href: "#academics", label: "Academics" },
  { href: "#operations", label: "Operations" },
  { href: "#campus", label: "Campus" },
];

export function LandingNav() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => setSolid(v > 24));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
    >
      {/* Floating glass bar: lightly frosted over the hero, deeper navy glass once the page scrolls under it. */}
      <div
        className={`mx-auto max-w-7xl overflow-hidden rounded-[28px] ring-1 backdrop-blur-xl backdrop-saturate-150 transition-[background-color,box-shadow,--tw-ring-color] duration-500 ${
          solid || open
            ? "bg-brand-deep/70 shadow-[0_18px_40px_-20px_rgba(7,21,40,0.7)] ring-white/[0.12]"
            : "bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-white/10"
        }`}
      >
        <nav aria-label="Main" className="flex h-16 items-center justify-between gap-6 pl-3 pr-2.5 sm:pl-4 sm:pr-3">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky"
          >
            <Crest size={38} priority className="transition-transform duration-500 group-hover:rotate-[8deg]" />
            <span className="font-display text-[17px] font-medium leading-none tracking-[-0.01em] text-white">
              <span className="hidden sm:inline">{SCHOOL.fullName}</span>
              <span className="sm:hidden">{SCHOOL.shortName}</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <ul className="flex items-center gap-7">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <NavLink href={l.href}>{l.label}</NavLink>
                </li>
              ))}
            </ul>
            <MagneticCta href="/login" className="!h-10 !px-5 !text-sm">
              Staff Sign In
            </MagneticCta>
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="relative grid h-11 w-11 place-items-center rounded-full text-white ring-1 ring-white/15 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky md:hidden"
          >
            <span aria-hidden className="relative block h-3 w-5">
              <motion.span
                className="absolute left-0 top-0 h-[1.5px] w-5 bg-current"
                animate={open ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
              />
              <motion.span
                className="absolute bottom-0 left-0 h-[1.5px] w-5 bg-current"
                animate={open ? { rotate: -45, y: -5.5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
              />
            </span>
          </button>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="overflow-hidden md:hidden"
            >
              <ul className="space-y-1 px-5 pb-5 pt-1">
                {LINKS.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i + 0.1, duration: 0.4, ease: EASE }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex h-12 items-center border-b border-white/10 font-display text-xl text-white/90 focus-visible:outline-none focus-visible:text-brand-sky"
                    >
                      {l.label}
                    </Link>
                  </motion.li>
                ))}
                <li className="pt-5">
                  <MagneticCta href="/login" className="w-full">
                    Staff Sign In
                  </MagneticCta>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}

/** Nav link with an underline that draws in from the left on hover/focus. */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group relative py-2 font-ui text-sm font-medium text-white/75 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
    >
      {children}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0.5 h-px origin-left scale-x-0 bg-brand-sky transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
      />
    </Link>
  );
}
