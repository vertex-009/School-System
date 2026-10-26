"use client";

import { motion } from "framer-motion";
import { EASE, Eyebrow, Reveal } from "./primitives";

type Ribbon = {
  title: string;
  body: string;
  who: string;
  Icon: (p: { className?: string }) => React.ReactElement;
};

const GROUPS: Array<{ id: string; label: string; ribbons: Ribbon[] }> = [
  {
    id: "academics",
    label: "Academics",
    ribbons: [
      {
        title: "Academics & timetable",
        body: "Classes, subjects and a weekly timetable the Principal publishes and every teacher follows.",
        who: "Principal · Teacher",
        Icon: CalendarIcon,
      },
      {
        title: "Attendance & marks",
        body: "Daily registers and term results entered by teachers, reviewed by the Principal.",
        who: "Teacher · Principal",
        Icon: CheckIcon,
      },
    ],
  },
  {
    id: "operations",
    label: "Finance Ops",
    ribbons: [
      {
        title: "Fees, invoices & cash collection",
        body: "Monthly class fees, generated invoices and receipts printed at the cash desk.",
        who: "Finance · Principal",
        Icon: InvoiceIcon,
      },
      {
        title: "Salaries & school expenses",
        body: "Staff and other employee salaries, and daily expenses weighed against income.",
        who: "Finance",
        Icon: ScaleIcon,
      },
    ],
  },
];

export function Platform() {
  return (
    <section aria-labelledby="platform-title" className="relative overflow-hidden bg-[color:var(--mist)] py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <Eyebrow>How it fits together</Eyebrow>
          </Reveal>
          <Reveal delay={0.08} as="h2">
            <span id="platform-title" className="mt-4 block font-display text-[clamp(2.3rem,5vw,4rem)] font-normal leading-[1.02] tracking-[-0.03em] text-brand-navy">
              Built for how a <em className="text-brand-accent">real school</em> runs.
            </span>
          </Reveal>
          <Reveal delay={0.16} as="p">
            <span className="mt-6 block max-w-md font-ui text-lg leading-relaxed text-[color:var(--slate-text)]">
              Every office keeps its own workspace, on one set of records. When Finance opens a fee month, staff are told. When a
              teacher marks the register, the Principal sees it.
            </span>
          </Reveal>
        </div>

        <div className="space-y-10">
          {GROUPS.map((g) => (
            <div key={g.id} id={g.id} className="scroll-mt-28">
              <Reveal>
                <div className="flex items-center gap-4">
                  <Eyebrow>{g.label}</Eyebrow>
                  <motion.span
                    aria-hidden
                    className="h-px flex-1 origin-left bg-brand-navy/15"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: EASE }}
                  />
                </div>
              </Reveal>
              <ul className="mt-2">
                {g.ribbons.map((r, i) => (
                  <Reveal as="li" key={r.title} delay={0.08 * (i + 1)}>
                    <RibbonRow ribbon={r} />
                  </Reveal>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** A full-width capability ribbon: icon, serif title, one line, and which roles touch it. */
function RibbonRow({ ribbon: { title, body, who, Icon } }: { ribbon: Ribbon }) {
  return (
    <div className="group relative grid grid-cols-[auto_minmax(0,1fr)] items-start gap-5 border-b border-brand-navy/10 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-7">
      {/* Sky hairline that sweeps across on hover */}
      <span
        aria-hidden
        className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-brand-sky transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
      />
      <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-brand-accent ring-1 ring-brand-navy/10 transition-all duration-500 group-hover:bg-brand-navy group-hover:text-brand-sky">
        <Icon className="h-[22px] w-[22px] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110" />
      </span>
      <div>
        <h3 className="font-display text-[1.55rem] font-normal leading-tight tracking-[-0.02em] text-brand-navy transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1">
          {title}
        </h3>
        <p className="mt-2 max-w-lg font-ui text-[15px] leading-relaxed text-[color:var(--slate-text)]">{body}</p>
      </div>
      <p className="col-start-2 font-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent/70 sm:col-start-auto sm:mt-2">{who}</p>
    </div>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M8 13h2M14 13h2M8 16.5h2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M5 4h14v16H5z" />
      <path d="m8.5 9 1.5 1.5L13 7.5M8.5 15l1.5 1.5 3-3M15.5 9.5h.01" />
    </svg>
  );
}

function InvoiceIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M6 3h9l3 3v15l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21V3Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 4v16M7 20h10M5 7h14" />
      <path d="m5 7-2.5 6a2.5 2.5 0 0 0 5 0L5 7ZM19 7l-2.5 6a2.5 2.5 0 0 0 5 0L19 7Z" />
    </svg>
  );
}
