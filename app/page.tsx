import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { homeFor, type Role } from "@/lib/session";
import { SCHOOL } from "@/lib/brand";

export default async function Home() {
  const jar = await cookies();
  const role = jar.get("sms_role")?.value as Role | undefined;
  if (role && ["principal", "teacher", "finance"].includes(role)) {
    redirect(homeFor(role));
  }

  return (
    <div className="min-h-screen bg-[#061528] text-slate-100 selection:bg-[#5dade2]/30 selection:text-white">
      {/* ── Top Navigation Bar ───────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#061528]/85 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20 transition group-hover:ring-[#5dade2]/60">
              <Image
                src={SCHOOL.logoSrc}
                alt={SCHOOL.fullName}
                fill
                priority
                sizes="44px"
                className="object-cover object-center"
              />
            </span>
            <div className="hidden sm:block">
              <p className="font-serif text-[1.05rem] font-bold tracking-wide text-white transition group-hover:text-[#5dade2]">
                {SCHOOL.fullName}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5dade2]">
                {SCHOOL.city}
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-6 md:gap-8">
            <a
              href="#roles"
              className="hidden text-sm font-medium text-slate-300 transition hover:text-[#5dade2] md:inline-block"
            >
              Roles
            </a>
            <a
              href="#academics"
              className="hidden text-sm font-medium text-slate-300 transition hover:text-[#5dade2] md:inline-block"
            >
              Academics
            </a>
            <a
              href="#operations"
              className="hidden text-sm font-medium text-slate-300 transition hover:text-[#5dade2] md:inline-block"
            >
              Operations
            </a>

            <Link
              href="/login"
              prefetch={true}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4ba3e3] to-[#60b5ef] px-5 py-2.5 text-sm font-bold text-[#061528] shadow-[0_0_24px_rgba(93,173,226,0.4)] transition hover:brightness-110 active:scale-95"
            >
              <span>Staff Sign In</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Deep ambient radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-10%] top-[-5%] h-[42rem] w-[50rem] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(93, 173, 226, 0.32) 0%, rgba(26, 82, 118, 0.18) 45%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Architectural arches & compass wireframe (matching user's reference) */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 hidden h-full w-[54%] md:block"
        >
          <svg
            className="h-full w-full opacity-35"
            viewBox="0 0 680 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Concentric compass circles */}
            <circle
              cx="480"
              cy="220"
              r="260"
              stroke="#5dade2"
              strokeWidth="1"
              strokeDasharray="4 6"
              opacity="0.35"
            />
            <circle
              cx="480"
              cy="220"
              r="340"
              stroke="#5dade2"
              strokeWidth="0.8"
              opacity="0.2"
            />

            {/* Architectural arches (pill windows) */}
            <path
              d="M120 600 V340 C120 280, 180 280, 180 340 V600"
              stroke="#5dade2"
              strokeWidth="1.5"
            />
            <path
              d="M200 600 V300 C200 230, 270 230, 270 300 V600"
              stroke="#5dade2"
              strokeWidth="1.5"
            />
            <path
              d="M290 600 V270 C290 190, 370 190, 370 270 V600"
              stroke="#5dade2"
              strokeWidth="1.5"
            />
            <path
              d="M390 600 V290 C390 215, 470 215, 470 290 V600"
              stroke="#5dade2"
              strokeWidth="1.5"
            />
            <path
              d="M490 600 V320 C490 250, 570 250, 570 320 V600"
              stroke="#5dade2"
              strokeWidth="1.5"
            />

            {/* Subtle grid accent rays */}
            <line x1="480" y1="220" x2="160" y2="40" stroke="#5dade2" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.3" />
            <line x1="480" y1="220" x2="300" y2="40" stroke="#5dade2" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.3" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Small Crest Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-md">
              <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-white/20">
                <Image
                  src={SCHOOL.logoSrc}
                  alt=""
                  fill
                  sizes="24px"
                  className="object-cover object-center"
                />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#5dade2]">
                Staff Platform <span className="text-white/40">/</span> {SCHOOL.city}
              </p>
            </div>

            {/* Big Headline */}
            <h1 className="mt-8 font-serif text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.4rem]">
              City Public School <br />
              <span className="font-serif font-normal italic text-[#5dade2]">
                & College
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-xl font-bold text-white/95 sm:text-2xl">
              Where academics, finance, and classrooms run as one.
            </p>

            {/* Description Paragraph */}
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300/85 sm:text-lg">
              The private staff platform behind the Principal&apos;s school-wide oversight,
              the Finance office&apos;s fees and salaries, and every teacher&apos;s classroom day.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4 pt-2 sm:gap-5">
              <Link
                href="/login"
                prefetch={true}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4ba3e3] to-[#60b5ef] px-7 py-3.5 text-base font-bold text-[#061528] shadow-[0_0_28px_rgba(93,173,226,0.45)] transition hover:brightness-110 active:scale-95"
              >
                <span>Staff Sign In</span>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>

              <a
                href="#roles"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.03] px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:border-[#5dade2]/60 hover:bg-white/[0.08]"
              >
                <span>Explore roles</span>
                <svg className="h-4 w-4 text-[#5dade2]" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Explore Roles ──────────────────────────── */}
      <section id="roles" className="relative scroll-mt-24 border-t border-white/[0.08] bg-[#07172e] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5dade2]">
              Staff Ecosystem
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Portals for Every Role
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
              Each portal provides focused tools, role-specific security, and real-time synchronisation across the institution.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {/* Role 1: Principal */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-sm transition hover:-translate-y-1 hover:border-[#5dade2]/40 hover:bg-white/[0.06]">
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#5dade2]/10 blur-2xl transition group-hover:bg-[#5dade2]/20" />
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a5276] to-[#0b2545] text-white shadow-md">
                    <svg className="h-6 w-6 text-[#5dade2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  </span>
                  <span className="rounded-full border border-[#5dade2]/30 bg-[#5dade2]/10 px-3 py-1 text-[11px] font-bold text-[#5dade2]">
                    Oversight
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-bold text-white">Principal</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Comprehensive executive oversight: active student body, faculty roster, fee collection analytics, class timetable allocations, and official reports.
                </p>

                <ul className="mt-5 space-y-2 text-xs text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5dade2]" />
                    Real-time fee collection & billing rate
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5dade2]" />
                    Teacher assignments & auto timetable
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5dade2]" />
                    Exam results publishing & merit lists
                  </li>
                </ul>
              </div>

              <Link
                href="/login"
                prefetch={true}
                className="mt-8 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white transition group-hover:border-[#5dade2] group-hover:bg-[#5dade2] group-hover:text-[#061528]"
              >
                <span>Principal Sign In</span>
                <span>→</span>
              </Link>
            </div>

            {/* Role 2: Finance */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-sm transition hover:-translate-y-1 hover:border-[#5dade2]/40 hover:bg-white/[0.06]">
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#5dade2]/10 blur-2xl transition group-hover:bg-[#5dade2]/20" />
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a5276] to-[#0b2545] text-white shadow-md">
                    <svg className="h-6 w-6 text-[#5dade2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </span>
                  <span className="rounded-full border border-[#5dade2]/30 bg-[#5dade2]/10 px-3 py-1 text-[11px] font-bold text-[#5dade2]">
                    Accounts & Cash
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-bold text-white">Finance & Accounts</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Full fiscal lifecycle: automated monthly student fee invoicing, counter cash collection, teacher salaries, staff payroll, and operational expenses.
                </p>

                <ul className="mt-5 space-y-2 text-xs text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5dade2]" />
                    Instant fee receipt generation & printing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5dade2]" />
                    Teacher & staff salary disbursement
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5dade2]" />
                    Income vs expenses fiscal reports
                  </li>
                </ul>
              </div>

              <Link
                href="/login"
                prefetch={true}
                className="mt-8 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white transition group-hover:border-[#5dade2] group-hover:bg-[#5dade2] group-hover:text-[#061528]"
              >
                <span>Finance Sign In</span>
                <span>→</span>
              </Link>
            </div>

            {/* Role 3: Teacher */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-sm transition hover:-translate-y-1 hover:border-[#5dade2]/40 hover:bg-white/[0.06]">
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#5dade2]/10 blur-2xl transition group-hover:bg-[#5dade2]/20" />
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a5276] to-[#0b2545] text-white shadow-md">
                    <svg className="h-6 w-6 text-[#5dade2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </span>
                  <span className="rounded-full border border-[#5dade2]/30 bg-[#5dade2]/10 px-3 py-1 text-[11px] font-bold text-[#5dade2]">
                    Classroom
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-bold text-white">Faculty & Teachers</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Day-to-day academic records: fast daily attendance marking, examination scores entry, student performance tracking, and personal teaching timetable.
                </p>

                <ul className="mt-5 space-y-2 text-xs text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5dade2]" />
                    Fast 1-tap student attendance marking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5dade2]" />
                    Subject exam marks & assessment entry
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5dade2]" />
                    Personal schedule & class rosters
                  </li>
                </ul>
              </div>

              <Link
                href="/login"
                prefetch={true}
                className="mt-8 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white transition group-hover:border-[#5dade2] group-hover:bg-[#5dade2] group-hover:text-[#061528]"
              >
                <span>Teacher Sign In</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Academics ─────────────────────────────── */}
      <section id="academics" className="relative scroll-mt-24 border-t border-white/[0.08] bg-[#061528] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5dade2]">
                Academic Excellence
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Rigorous Academic Management, Simplified.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                City Public School &amp; College provides faculty and leadership with real-time insight into classroom delivery, student regularity, and examination outcomes.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#5dade2]/15 text-[#5dade2]">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Automated Timetable Generation</h4>
                    <p className="mt-1 text-xs text-slate-400">
                      Algorithmic constraint solver generates conflict-free schedules across all sections and teacher workloads.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#5dade2]/15 text-[#5dade2]">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Daily Attendance &amp; Leave Records</h4>
                    <p className="mt-1 text-xs text-slate-400">
                      Live attendance counts empower leadership with instant visibility into student participation.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#5dade2]/15 text-[#5dade2]">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Standardized Merit Lists &amp; Result Cards</h4>
                    <p className="mt-1 text-xs text-slate-400">
                      Clean printable report cards with percentage, grade calculation, and student rank.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c264a] to-[#07172f] p-8 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-xs text-slate-400">academics.cpsc.edu.pk</span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="font-bold text-white">Class 10th - Science</span>
                    <span className="text-[#5dade2]">Attendance: 96%</span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[96%] rounded-full bg-gradient-to-r from-[#4ba3e3] to-[#5dade2]" />
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="font-bold text-white">Midterm Exam Results</span>
                    <span className="text-emerald-400">Published</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Overall class average: 82.4% · 34 Grade A+ awards</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="font-bold text-white">Active Teachers on Duty</span>
                    <span className="text-[#5dade2]">100% Present</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Timetable slots fully assigned without period clashes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Operations ────────────────────────────── */}
      <section id="operations" className="relative scroll-mt-24 border-t border-white/[0.08] bg-[#07172e] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5dade2]">
              Administrative Rigor
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Flawless Financial &amp; Campus Operations
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
              Transparent fee accounts, automated billing cycles, and complete audit readiness.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="text-2xl font-bold text-white">Automated Invoicing</div>
              <p className="mt-2 text-sm text-slate-300">
                Generate monthly fee invoices for the entire student body in one single click, with sibling discounts automatically calculated.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="text-2xl font-bold text-white">Salary Payroll</div>
              <p className="mt-2 text-sm text-slate-300">
                Structured monthly compensation recording for teaching faculty and auxiliary staff with printable salary slips.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="text-2xl font-bold text-white">National ID Tracking</div>
              <p className="mt-2 text-sm text-slate-300">
                Official CNIC format validation (XXXXX-XXXXXXX-X) for all parents, guardians, and employees ensuring government compliance.
              </p>
            </div>
          </div>

          {/* Call to action */}
          <div className="mt-16 overflow-hidden rounded-3xl border border-[#5dade2]/30 bg-gradient-to-r from-[#0d2a4a] via-[#103358] to-[#0b213b] p-8 text-center sm:p-12">
            <h3 className="font-serif text-2xl font-bold text-white sm:text-3xl">
              Ready to access your portal?
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300 sm:text-base">
              Authorized staff members can sign in with their assigned institutional email and password.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                prefetch={true}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4ba3e3] to-[#60b5ef] px-8 py-3.5 text-base font-bold text-[#061528] shadow-[0_0_24px_rgba(93,173,226,0.4)] transition hover:brightness-110 active:scale-95"
              >
                <span>Enter Staff Portal</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#051120] py-12 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <div className="flex items-center gap-3">
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/20">
              <Image src={SCHOOL.logoSrc} alt="" fill sizes="32px" className="object-cover object-center" />
            </span>
            <span className="text-sm font-bold text-white">{SCHOOL.fullName}</span>
            <span className="text-xs text-slate-500">· {SCHOOL.city}</span>
          </div>

          <p className="text-xs italic text-slate-400 font-serif">
            {SCHOOL.motto} · تعلیم روشنی ہے، نظم ترقی ہے
          </p>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {SCHOOL.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
