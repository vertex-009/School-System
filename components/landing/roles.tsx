"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE, Eyebrow, Reveal } from "./primitives";

type RoleKey = "principal" | "finance" | "teacher";

type Role = {
  key: RoleKey;
  label: string;
  eyebrow: string;
  title: string;
  line: string;
  capabilities: string[];
  Icon: (p: { className?: string }) => React.ReactElement;
};

const ROLES: Role[] = [
  {
    key: "principal",
    label: "Principal",
    eyebrow: "Academic leadership",
    title: "Command of the whole school, from one calm view.",
    line: "Academic leadership and school oversight.",
    capabilities: [
      "School-wide dashboard for students, teachers, classes and exams",
      "Fee collection, unpaid balances and expenses at a glance",
      "Teachers, staff, class structure and subjects",
      "Timetables built, teachers assigned, schedules published",
      "Attendance and results oversight, school announcements",
      "Student and parent issues when a student is marked as left",
      "Monthly account overview",
    ],
    Icon: PrincipalIcon,
  },
  {
    key: "finance",
    label: "Finance",
    eyebrow: "Finance office",
    title: "Money and records, clean and fast.",
    line: "Fees, cash, salaries and student records.",
    capabilities: [
      "Student registry: add, import by class, class and school transfers",
      "Monthly class fees, invoice generation, paid and unpaid records",
      "Cash collection with printable receipts",
      "Expenses tracking, income against expenses",
      "Salaries for teachers, finance staff, drivers, peons and guards",
      "Fee-open announcements to staff when a fee month opens",
      "Finance reports and history",
    ],
    Icon: FinanceIcon,
  },
  {
    key: "teacher",
    label: "Teacher",
    eyebrow: "Classroom",
    title: "Teach with less admin friction.",
    line: "Classroom execution, every school day.",
    capabilities: [
      "Assigned classes and a weekly timetable with rooms",
      "Student rosters by class and section",
      "Daily attendance, marked and edited",
      "Marks entry for terms and finals",
      "Salary status and payment history",
      "School announcements, and notes to the Principal or Finance",
    ],
    Icon: TeacherIcon,
  },
];

export function Roles() {
  const [active, setActive] = useState<RoleKey>("principal");
  const tabRefs = useRef<Record<RoleKey, HTMLButtonElement | null>>({ principal: null, finance: null, teacher: null });
  const role = ROLES.find((r) => r.key === active)!;

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const delta = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = ROLES[(index + delta + ROLES.length) % ROLES.length];
    setActive(next.key);
    tabRefs.current[next.key]?.focus();
  }

  return (
    <section id="roles" aria-labelledby="roles-title" className="relative bg-white py-14 sm:py-20">
      <div aria-hidden className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-soft/70 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow>Staff Platform</Eyebrow>
          </Reveal>
          <Reveal delay={0.08} as="h2">
            <span id="roles-title" className="mt-4 block font-display text-[clamp(2.3rem,5vw,4rem)] font-normal leading-[1.02] tracking-[-0.03em] text-brand-navy">
              Three roles. <em className="text-brand-accent">One school system.</em>
            </span>
          </Reveal>
          <Reveal delay={0.16} as="p">
            <span className="mt-5 block font-ui text-lg leading-relaxed text-[color:var(--slate-text)]">
              Each member of staff signs in to a workspace shaped around their job, on the same school records.
            </span>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-6 lg:mt-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          {/* Role selectors */}
          <div role="tablist" aria-label="Staff roles" aria-orientation="vertical" className="flex flex-col gap-3">
            {ROLES.map((r, i) => {
              const selected = r.key === active;
              return (
                <motion.div
                  key={r.key}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: 0.8, delay: i * 0.14, ease: EASE }}
                >
                  <button
                    ref={(el) => {
                      tabRefs.current[r.key] = el;
                    }}
                    role="tab"
                    id={`tab-${r.key}`}
                    aria-selected={selected}
                    aria-controls="roles-panel"
                    tabIndex={selected ? 0 : -1}
                    // Mouse users preview a role by hovering; touch and keyboard still select by tap/click/arrows.
                    onPointerEnter={(e) => e.pointerType === "mouse" && setActive(r.key)}
                    onClick={() => setActive(r.key)}
                    onKeyDown={(e) => onKeyDown(e, i)}
                    className={`group relative w-full overflow-hidden rounded-2xl px-5 py-5 text-left transition-[box-shadow,transform,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky focus-visible:ring-offset-2 sm:px-7 sm:py-6 ${
                      selected
                        ? "bg-brand-navy text-white shadow-[0_24px_48px_-24px_rgba(11,31,58,0.55)]"
                        : "bg-white text-brand-navy ring-1 ring-slate-200/80 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(11,31,58,0.35)] hover:ring-brand-sky/50"
                    }`}
                  >
                    {selected && (
                      <motion.span
                        layoutId="role-glow"
                        aria-hidden
                        className="absolute inset-0 bg-[radial-gradient(80%_120%_at_100%_0%,rgba(93,173,226,0.28),transparent_60%)]"
                        transition={{ duration: 0.6, ease: EASE }}
                      />
                    )}
                    <span className="relative flex items-start gap-4 sm:gap-5">
                      <span
                        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-colors duration-500 ${
                          selected ? "bg-white/10 text-brand-sky" : "bg-brand-soft text-brand-accent"
                        }`}
                      >
                        <r.Icon className="h-6 w-6 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:rotate-[-6deg]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block font-ui text-[10.5px] font-semibold uppercase tracking-[0.3em] ${selected ? "text-brand-sky" : "text-brand-accent/80"}`}>
                          {r.eyebrow}
                        </span>
                        <span className="mt-1.5 block font-display text-2xl tracking-[-0.02em] sm:text-[1.7rem]">{r.label}</span>
                        <span className={`mt-1 block font-ui text-sm ${selected ? "text-slate-300" : "text-[color:var(--slate-text)]"}`}>{r.line}</span>
                      </span>
                      <span
                        aria-hidden
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full transition-all duration-500 ${
                          selected ? "scale-100 bg-brand-sky shadow-[0_0_0_6px_rgba(93,173,226,0.18)]" : "scale-75 bg-slate-300"
                        }`}
                      />
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Detail panel + workflow preview */}
          <Reveal delay={0.2}>
            <div
              role="tabpanel"
              id="roles-panel"
              aria-labelledby={`tab-${role.key}`}
              className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#0b1f3a_0%,#071528_70%)] p-6 text-white sm:p-10"
            >
              <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-sky/15 blur-[80px]" />
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={role.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="relative"
                >
                  <h3 className="max-w-lg font-display text-[clamp(1.6rem,3vw,2.3rem)] font-normal leading-[1.1] tracking-[-0.02em]">{role.title}</h3>

                  <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <ul className="space-y-3">
                      {role.capabilities.map((c, i) => (
                        <motion.li
                          key={c}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.08 + i * 0.05, duration: 0.45, ease: EASE }}
                          className="flex gap-3 font-ui text-[14.5px] leading-snug text-slate-200"
                        >
                          <span aria-hidden className="mt-[0.55em] h-px w-3 shrink-0 bg-brand-sky" />
                          {c}
                        </motion.li>
                      ))}
                    </ul>
                    <WorkflowPreview role={role.key} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Stylized workflow previews (illustrative UI chrome, not live data) ---------- */

function PreviewFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div aria-hidden className="rounded-2xl bg-white/[0.04] p-1 ring-1 ring-white/10">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-ui text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">{title}</span>
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-brand-sky/70" />
        </span>
      </div>
      <div className="rounded-xl bg-white p-4 text-brand-navy">{children}</div>
    </div>
  );
}

function Bar({ w, className = "bg-slate-200" }: { w: string; className?: string }) {
  return <span className={`block h-1.5 rounded-full ${className}`} style={{ width: w }} />;
}

function WorkflowPreview({ role }: { role: RoleKey }) {
  const reduce = useReducedMotion();
  const item = (i: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.2 + i * 0.07, duration: 0.5, ease: EASE },
  });

  if (role === "principal") {
    return (
      <PreviewFrame title="School overview">
        <div className="grid grid-cols-2 gap-2">
          {["Students", "Teachers", "Classes", "Exams"].map((k, i) => (
            <motion.div key={k} {...item(i)} className="rounded-lg bg-brand-soft/70 px-3 py-2.5">
              <span className="block font-ui text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-accent">{k}</span>
              <span className="mt-2 block h-2.5 w-10 rounded bg-brand-navy/80" />
            </motion.div>
          ))}
        </div>
        <motion.div {...item(4)} className="mt-4">
          <div className="flex justify-between font-ui text-[10px] font-semibold text-slate-500">
            <span>Fees collected</span>
            <span>Unpaid</span>
          </div>
          <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.span
              className="h-full bg-brand-accent"
              initial={{ width: "0%" }}
              animate={{ width: "68%" }}
              transition={{ delay: 0.5, duration: 1.1, ease: EASE }}
            />
            <span className="h-full flex-1 bg-brand-sky/40" />
          </div>
        </motion.div>
        <motion.div {...item(5)} className="mt-4 grid grid-cols-5 gap-1">
          {Array.from({ length: 15 }).map((_, i) => (
            <span key={i} className={`h-4 rounded ${i % 4 === 0 ? "bg-brand-sky/60" : i % 3 === 0 ? "bg-brand-navy/80" : "bg-slate-100"}`} />
          ))}
        </motion.div>
        <motion.p {...item(6)} className="mt-2 font-ui text-[10px] font-semibold text-slate-400">
          Timetable · published
        </motion.p>
      </PreviewFrame>
    );
  }

  if (role === "finance") {
    const rows: Array<{ paid: boolean; w: string }> = [
      { paid: true, w: "62%" },
      { paid: false, w: "48%" },
      { paid: true, w: "70%" },
      { paid: true, w: "54%" },
    ];
    return (
      <PreviewFrame title="Fee records">
        <ul className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <motion.li key={i} {...item(i)} className="flex items-center gap-3 py-2.5">
              <span className="h-6 w-6 shrink-0 rounded-full bg-brand-soft" />
              <span className="flex-1 space-y-1.5">
                <Bar w={r.w} className="bg-slate-300" />
                <Bar w="30%" />
              </span>
              <span
                className={`rounded-full px-2 py-0.5 font-ui text-[10px] font-bold ${
                  r.paid ? "bg-brand-soft text-brand-accent" : "bg-slate-100 text-slate-500"
                }`}
              >
                {r.paid ? "Paid" : "Unpaid"}
              </span>
            </motion.li>
          ))}
        </ul>
        <motion.div {...item(4)} className="mt-3 flex items-center justify-between rounded-lg border border-dashed border-slate-200 px-3 py-2.5">
          <span className="font-ui text-[11px] font-semibold text-slate-500">Receipt ready</span>
          <span className="rounded-md bg-brand-navy px-2.5 py-1 font-ui text-[10px] font-bold text-white">Collect cash</span>
        </motion.div>
      </PreviewFrame>
    );
  }

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return (
    <PreviewFrame title="My week">
      <div className="grid grid-cols-5 gap-1.5">
        {days.map((d, i) => (
          <motion.div key={d} {...item(i)} className="space-y-1.5">
            <span className="block text-center font-ui text-[10px] font-semibold text-slate-400">{d}</span>
            {[0, 1, 2].map((p) => (
              <span
                key={p}
                className={`block rounded-md px-1 py-1.5 text-center font-ui text-[9px] font-bold ${
                  (i + p) % 3 === 0 ? "bg-brand-navy text-white" : (i + p) % 3 === 1 ? "bg-brand-soft text-brand-accent" : "bg-slate-50 text-slate-300"
                }`}
              >
                {(i + p) % 3 === 2 ? "—" : `Rm ${10 + ((i * 3 + p) % 9)}`}
              </span>
            ))}
          </motion.div>
        ))}
      </div>
      <motion.div {...item(5)} className="mt-4 space-y-2">
        <span className="block font-ui text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Attendance</span>
        {[true, true, false].map((present, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="h-5 w-5 rounded-full bg-slate-100" />
            <Bar w={["55%", "42%", "50%"][i]} className="flex-none bg-slate-200" />
            <span
              className={`ml-auto grid h-5 w-5 place-items-center rounded-md font-ui text-[10px] font-bold ${
                present ? "bg-brand-accent text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              {present ? "P" : "A"}
            </span>
          </div>
        ))}
      </motion.div>
    </PreviewFrame>
  );
}

/* ---------- Line icons ---------- */

function PrincipalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M3 10 12 5l9 5-9 5-9-5Z" />
      <path d="M7 12.2V16c0 1.4 2.2 3 5 3s5-1.6 5-3v-3.8" />
      <path d="M21 10v5" />
    </svg>
  );
}

function FinanceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M6 3h9l3 3v15l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21V3Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

function TeacherIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4M7 8.5h6M7 11.5h4" />
    </svg>
  );
}
