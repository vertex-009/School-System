"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SCHOOL } from "./brand";
import { Crest, EASE, Eyebrow, MagneticCta, Reveal } from "./primitives";

/** Local identity strip — one composition, no metrics. */
export function IdentityStrip() {
  const parts = [SCHOOL.city, SCHOOL.fullName, "Staff portal"];
  return (
    <section aria-label="About this portal" className="border-y border-brand-navy/10 bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-5 text-center sm:px-8">
        <motion.p
          className="flex flex-col items-center gap-2 font-display text-[clamp(1.5rem,3.4vw,2.6rem)] font-normal tracking-[-0.02em] text-brand-navy sm:flex-row sm:justify-center sm:gap-5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14 } } }}
        >
          {parts.map((p, i) => (
            <motion.span
              key={p}
              className="flex items-center gap-5"
              variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } } }}
            >
              {i > 0 && <span aria-hidden className="hidden h-1.5 w-1.5 rounded-full bg-brand-sky sm:block" />}
              <span className={i === 1 ? "italic text-brand-accent" : ""}>{p}</span>
            </motion.span>
          ))}
        </motion.p>
        <Reveal delay={0.4} as="p">
          <span className="mt-5 block font-ui text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
            Secure staff access <span className="mx-2 text-brand-sky">·</span> Role-based workspaces
          </span>
        </Reveal>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="relative isolate overflow-hidden bg-brand-navy py-14 text-white sm:py-20">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_120%,rgba(93,173,226,0.28),transparent_60%)]" />
        <motion.div
          className="absolute left-1/2 top-full h-[60rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-sky/15"
          initial={{ scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, ease: EASE }}
        />
        <motion.div
          className="absolute left-1/2 top-full h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-sky/10"
          initial={{ scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, delay: 0.15, ease: EASE }}
        />
      </div>

      <div className="mx-auto flex max-w-4xl flex-col items-center px-5 text-center sm:px-8">
        <Reveal>
          <Eyebrow tone="light">Staff Sign In</Eyebrow>
        </Reveal>
        <Reveal delay={0.08} as="h2">
          <span id="cta-title" className="mt-5 block font-display text-[clamp(2.8rem,7vw,5.5rem)] font-normal leading-[0.98] tracking-[-0.035em]">
            Enter your <em className="text-brand-sky">workspace.</em>
          </span>
        </Reveal>
        <Reveal delay={0.16} as="p">
          <span className="mt-6 block max-w-xl font-ui text-lg leading-relaxed text-slate-300">
            Principal, Finance, and Teachers sign in with school credentials.
          </span>
        </Reveal>
        <Reveal delay={0.24} className="mt-10 w-full sm:w-auto">
          <MagneticCta href="/login" size="lg" className="w-full sm:w-auto">
            Staff Sign In
          </MagneticCta>
        </Reveal>
        <Reveal delay={0.32} as="p">
          <span className="mt-5 block font-ui text-sm text-slate-400">Forgot password available on the sign-in page.</span>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-brand-deep text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <Crest size={52} />
          <div>
            <p className="font-display text-xl tracking-[-0.01em] text-white">{SCHOOL.fullName}</p>
            <p className="mt-1 font-ui text-sm">{SCHOOL.city}, Pakistan</p>
          </div>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-8 gap-y-3 font-ui text-sm font-medium">
            <li>
              <FooterLink href="/login">Sign in</FooterLink>
            </li>
            <li>
              <FooterLink href="#roles">Roles</FooterLink>
            </li>
            <li>
              <FooterLink href="#campus">Campus</FooterLink>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/[0.06]">
        <p className="mx-auto max-w-7xl px-5 py-6 font-ui text-xs text-slate-500 sm:px-8">
          &copy; {year} {SCHOOL.fullName}. Staff use only.
        </p>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group relative py-1 text-slate-300 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none">
      {children}
      <span
        aria-hidden
        className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-brand-sky transition-transform duration-500 group-hover:scale-x-100 group-focus-visible:scale-x-100"
      />
    </Link>
  );
}
