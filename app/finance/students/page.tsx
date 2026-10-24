import Link from "next/link";
import { setStudentStatus } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { classNameOf } from "@/lib/class-label";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

const CLASS_PALETTES = [
  {
    card: "border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-950",
    badge: "bg-emerald-600 text-white",
    countPill: "bg-emerald-100 text-emerald-800 border border-emerald-200/60",
    active: "bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300",
  },
  {
    card: "border-sky-200 bg-sky-50/70 hover:bg-sky-100/80 text-sky-950",
    badge: "bg-sky-600 text-white",
    countPill: "bg-sky-100 text-sky-800 border border-sky-200/60",
    active: "bg-sky-700 text-white border-sky-700 shadow-md ring-2 ring-sky-300",
  },
  {
    card: "border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 text-purple-950",
    badge: "bg-purple-600 text-white",
    countPill: "bg-purple-100 text-purple-800 border border-purple-200/60",
    active: "bg-purple-700 text-white border-purple-700 shadow-md ring-2 ring-purple-300",
  },
  {
    card: "border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 text-amber-950",
    badge: "bg-amber-600 text-white",
    countPill: "bg-amber-100 text-amber-800 border border-amber-200/60",
    active: "bg-amber-700 text-white border-amber-700 shadow-md ring-2 ring-amber-300",
  },
  {
    card: "border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-rose-950",
    badge: "bg-rose-600 text-white",
    countPill: "bg-rose-100 text-rose-800 border border-rose-200/60",
    active: "bg-rose-700 text-white border-rose-700 shadow-md ring-2 ring-rose-300",
  },
  {
    card: "border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-950",
    badge: "bg-indigo-600 text-white",
    countPill: "bg-indigo-100 text-indigo-800 border border-indigo-200/60",
    active: "bg-indigo-700 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300",
  },
  {
    card: "border-teal-200 bg-teal-50/70 hover:bg-teal-100/80 text-teal-950",
    badge: "bg-teal-600 text-white",
    countPill: "bg-teal-100 text-teal-800 border border-teal-200/60",
    active: "bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-300",
  },
  {
    card: "border-orange-200 bg-orange-50/70 hover:bg-orange-100/80 text-orange-950",
    badge: "bg-orange-600 text-white",
    countPill: "bg-orange-100 text-orange-800 border border-orange-200/60",
    active: "bg-orange-700 text-white border-orange-700 shadow-md ring-2 ring-orange-300",
  },
  {
    card: "border-cyan-200 bg-cyan-50/70 hover:bg-cyan-100/80 text-cyan-950",
    badge: "bg-cyan-600 text-white",
    countPill: "bg-cyan-100 text-cyan-800 border border-cyan-200/60",
    active: "bg-cyan-700 text-white border-cyan-700 shadow-md ring-2 ring-cyan-300",
  },
  {
    card: "border-violet-200 bg-violet-50/70 hover:bg-violet-100/80 text-violet-950",
    badge: "bg-violet-600 text-white",
    countPill: "bg-violet-100 text-violet-800 border border-violet-200/60",
    active: "bg-violet-700 text-white border-violet-700 shadow-md ring-2 ring-violet-300",
  },
];

export default async function FinanceStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; class?: string; status?: string; view?: string }>;
}) {
  const { q = "", class: classId = "", status = "", view = "" } = await searchParams;
  const isDirectoryOpen = Boolean(classId || q.trim() || status || view === "all");

  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const [{ data: classes }, { data: sections }, { data: allStudents }] = await Promise.all([
    supabase.from("classes").select("id, name").eq("school_id", schoolId).order("sort_order").order("name"),
    supabase.from("sections").select("id, name, class_id, classes(name)").eq("school_id", schoolId),
    supabase.from("students").select("id, section_id, status").eq("school_id", schoolId),
  ]);

  const sectionToClass = new Map<string, string>();
  for (const s of sections || []) {
    if (s.id && s.class_id) sectionToClass.set(s.id, s.class_id);
  }

  const classCountMap: Record<string, number> = {};
  let totalActive = 0;
  let totalLeft = 0;
  for (const st of allStudents || []) {
    if (st.status === "active") totalActive++;
    if (st.status === "left") totalLeft++;
    const cId = st.section_id ? sectionToClass.get(st.section_id) : null;
    if (cId && st.status === "active") {
      classCountMap[cId] = (classCountMap[cId] || 0) + 1;
    }
  }

  const classOptions = (classes || []).map((c) => ({
    id: c.id,
    name: c.name,
    count: classCountMap[c.id] || 0,
  }));

  const activeClass = classOptions.find((c) => c.id === classId);

  // Helper to build filter query string while preserving open directory
  const buildQuery = (newParams: { q?: string; class?: string; status?: string; view?: string }) => {
    const params = new URLSearchParams();
    const merged = {
      q,
      class: classId,
      status,
      view: view || (!classId ? "all" : undefined),
      ...newParams,
    };
    if (merged.q) params.set("q", merged.q);
    if (merged.class) params.set("class", merged.class);
    if (merged.status) params.set("status", merged.status);
    if (merged.view && !merged.class) params.set("view", merged.view);
    const qs = params.toString();
    return qs ? `/finance/students?${qs}` : "/finance/students";
  };

  // Only query detailed student records when the directory is opened
  let list: Array<{
    id: string;
    name: string;
    admission_no: string;
    father_name: string | null;
    guardian_phone: string | null;
    status: string;
    roll_no: number | null;
    section_id: string | null;
    sections?: any;
    photo_url?: string | null;
  }> = [];

  if (isDirectoryOpen) {
    let query = supabase
      .from("students")
      .select(
        "id, name, admission_no, father_name, guardian_phone, status, roll_no, section_id, sections(name, classes(name))"
      )
      .eq("school_id", schoolId)
      .order("name");

    if (classId) {
      const sectionIds = (sections || []).filter((s) => s.class_id === classId).map((s) => s.id);
      if (sectionIds.length) query = query.in("section_id", sectionIds);
      else query = query.eq("section_id", "00000000-0000-0000-0000-000000000000");
    }

    if (status && (status === "active" || status === "left")) {
      query = query.eq("status", status);
    }

    if (q.trim()) {
      const { studentSearchOr } = await import("@/lib/search");
      query = query.or(studentSearchOr(q));
    }

    const { data: students } = await query;
    const { filterStudentsBySearch } = await import("@/lib/search");
    list = q.trim() ? filterStudentsBySearch(students || [], q) : students || [];
  }

  return (
    <Shell role="finance" title="Students">
      <div className="space-y-5">
        {/* Top Header Banner */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#1a5276]/30 bg-gradient-to-r from-[#0b1f3a] via-[#102d54] to-[#1a5276] p-6 sm:p-7 text-white shadow-[0_4px_20px_rgba(11,31,58,0.15)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-300 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                Finance Portal · Student Management
              </div>
              <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Students
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-2 text-center sm:text-right backdrop-blur-sm shrink-0">
                <p className="text-xl font-black text-white tabular-nums">{totalActive}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-200">
                  Active Students
                </p>
              </div>

              {totalLeft > 0 && (
                <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-center sm:text-right backdrop-blur-sm shrink-0">
                  <p className="text-xl font-black text-slate-300 tabular-nums">{totalLeft}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Left Students
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Action Boxes (Add Student, Student Directory, Import by class) */}
        <div className="grid gap-4 sm:grid-cols-3 max-w-4xl">
            {/* 1. Add Student */}
            <Link
              href="/finance/students/new"
              className="group relative flex flex-col justify-between rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/20 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25 transition group-hover:scale-105">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                  <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-[#0b1f3a] transition group-hover:text-emerald-700">
                  Add Student
                </h3>
              </div>
            </Link>

            {/* 2. Student Directory */}
            <Link
              href={isDirectoryOpen ? "/finance/students" : "/finance/students?view=all"}
              className={`group relative flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                isDirectoryOpen
                  ? "border-sky-400 bg-gradient-to-br from-sky-50 via-white to-blue-50 ring-2 ring-sky-300"
                  : "border-sky-200/90 bg-gradient-to-br from-sky-50/50 via-white to-blue-50/20 hover:border-sky-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b1f3a] text-white shadow-md shadow-slate-900/25 transition group-hover:scale-105">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-800 transition group-hover:bg-[#0b1f3a] group-hover:text-white">
                  <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#0b1f3a] transition group-hover:text-brand-accent">
                  Student Directory
                </h3>
                {isDirectoryOpen && (
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-800">
                    Open
                  </span>
                )}
              </div>
            </Link>

            {/* 3. Import by class (Exclusive to Finance) */}
            <Link
              href="/finance/students/import"
              className="group relative flex flex-col justify-between rounded-2xl border border-purple-200/90 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/20 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-purple-400 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-700 text-white shadow-md shadow-purple-700/25 transition group-hover:scale-105">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-800 transition group-hover:bg-purple-700 group-hover:text-white">
                  <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-[#0b1f3a] transition group-hover:text-purple-700">
                  Import by class
                </h3>
              </div>
            </Link>
          </div>

        {/* Directory Section: Only shown when opened (via Student Directory or Class selection) */}
        {isDirectoryOpen && (
          <>
            {/* Colorful Class Quick Buttons */}
            <section className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-50 text-sky-600 font-bold text-xs shadow-xs">
                    🎓
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Classes
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/finance/students"
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 px-3 py-1.5 text-xs font-bold text-slate-700 transition cursor-pointer"
                  >
                    ✕ Close Directory
                  </Link>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {classOptions.length} Classes
                  </span>
                </div>
              </div>

              {/* Quick Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                {/* 1. All Students Button */}
                <Link
                  href="/finance/students?view=all"
                  className={`group relative flex items-center gap-3 rounded-2xl p-3 border transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-sm hover:-translate-y-0.5 ${
                    view === "all" && !classId
                      ? "bg-gradient-to-br from-[#0b1f3a] via-[#102d54] to-[#1a5276] text-white shadow-md border-transparent ring-2 ring-sky-400"
                      : "bg-slate-900 hover:bg-slate-800 text-white border-slate-800"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white font-black text-base shadow-xs">
                    👥
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-black text-white">
                      All Students
                    </span>
                    <span className="block text-[11px] font-semibold text-sky-200">
                      {totalActive} Enrolled
                    </span>
                  </div>
                </Link>

                {/* 2. Each Class Colorful Button */}
                {classOptions.map((c, idx) => {
                  const isSelected = classId === c.id;
                  const palette = CLASS_PALETTES[idx % CLASS_PALETTES.length];
                  const shortBadge = c.name.replace(/^Class\s+/i, "C-").slice(0, 5);

                  return (
                    <Link
                      key={c.id}
                      href={`/finance/students?class=${c.id}`}
                      className={`group relative flex items-center gap-3 rounded-2xl p-3 border transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-sm hover:-translate-y-0.5 ${
                        isSelected ? palette.active : `${palette.card}`
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-xs uppercase shadow-xs transition-transform group-hover:scale-105 ${
                          isSelected ? "bg-white/20 text-white" : palette.badge
                        }`}
                      >
                        {shortBadge}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-xs font-black ${
                            isSelected ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {c.name}
                        </span>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isSelected ? "bg-white/20 text-white" : palette.countPill
                          }`}
                        >
                          {c.count} {c.count === 1 ? "student" : "students"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Search & Filter Toolbar */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
              <form method="get" className="flex flex-col sm:flex-row sm:items-center gap-3">
                {classId ? (
                  <input type="hidden" name="class" value={classId} />
                ) : (
                  <input type="hidden" name="view" value="all" />
                )}
                {status && <input type="hidden" name="status" value={status} />}

                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    name="q"
                    defaultValue={q}
                    placeholder="Search by student name, roll no, admission no, or father name..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-brand-navy focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    name="class"
                    defaultValue={classId}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-brand-navy"
                  >
                    <option value="">All Classes</option>
                    {classOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.count})
                      </option>
                    ))}
                  </select>

                  <select
                    name="status"
                    defaultValue={status}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-brand-navy"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="left">Left Only</option>
                  </select>

                  <button
                    type="submit"
                    className="rounded-xl bg-[#0b1f3a] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-brand-accent active:scale-95 cursor-pointer"
                  >
                    Search
                  </button>

                  {(q || status || classId) && (
                    <Link
                      href={classId ? `/finance/students?class=${classId}` : "/finance/students?view=all"}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-xs"
                    >
                      Reset
                    </Link>
                  )}
                </div>
              </form>

              {/* Quick Status Filter Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                  Status:
                </span>
                <Link
                  href={buildQuery({ status: "" })}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold shrink-0 transition ${
                    !status ? "bg-brand-navy text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Statuses ({totalActive + totalLeft})
                </Link>
                <Link
                  href={buildQuery({ status: "active" })}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold shrink-0 transition ${
                    status === "active" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  Active ({totalActive})
                </Link>
                {totalLeft > 0 && (
                  <Link
                    href={buildQuery({ status: "left" })}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold shrink-0 transition ${
                      status === "left" ? "bg-rose-600 text-white shadow-xs" : "bg-rose-50 text-rose-800 hover:bg-rose-100"
                    }`}
                  >
                    Left ({totalLeft})
                  </Link>
                )}
              </div>
            </section>

            {/* Complete Students Directory Table */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0b1f3a]">
                    {activeClass ? `Students in ${activeClass.name}` : "All Students"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {list.length} student{list.length !== 1 ? "s" : ""} found
                    {q.trim() ? ` · Matching “${q.trim()}”` : ""}
                    {status ? ` · Status: ${status}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {list.length} Shown
                  </span>
                  <Link
                    href="/finance/students"
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 px-3 py-1 text-xs font-bold text-slate-600 transition"
                    title="Close Directory"
                  >
                    ✕ Close Directory
                  </Link>
                </div>
              </div>

              {!list.length ? (
                <div className="py-14 text-center">
                  <p className="text-sm font-semibold text-slate-600">No students match this search or filter.</p>
                  <Link
                    href={classId ? `/finance/students?class=${classId}` : "/finance/students?view=all"}
                    className="mt-2 inline-block text-xs font-bold text-brand-navy underline"
                  >
                    Clear search filter
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 pr-4">Student</th>
                        <th className="py-3 pr-4">Admission No</th>
                        <th className="py-3 pr-4">Class</th>
                        <th className="py-3 pr-4">Father Name</th>
                        <th className="py-3 pr-4">Guardian Phone</th>
                        <th className="py-3 pr-4">Status</th>
                        <th className="py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {list.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Student Info */}
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                                {s.photo_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={s.photo_url}
                                    alt={s.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-brand-navy">
                                    {s.name
                                      .split(/\s+/)
                                      .filter(Boolean)
                                      .slice(0, 2)
                                      .map((p: string) => p[0]?.toUpperCase() || "")
                                      .join("") || "?"}
                                  </span>
                                )}
                                {s.status === "active" && (
                                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                                )}
                              </div>
                              <div>
                                <Link
                                  href={`/finance/students/${s.id}`}
                                  className="font-bold text-brand-navy hover:text-brand-accent transition-colors"
                                >
                                  {s.name}
                                </Link>
                                <p className="text-xs text-slate-400">
                                  Roll No: {s.roll_no != null ? s.roll_no : "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Admission No */}
                          <td className="py-3.5 pr-4 text-xs font-bold text-slate-700 tabular-nums">
                            {s.admission_no}
                          </td>

                          {/* Class */}
                          <td className="py-3.5 pr-4">
                            <span className="inline-flex items-center rounded-lg bg-sky-50 border border-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800">
                              {classNameOf(s.sections) || "—"}
                            </span>
                          </td>

                          {/* Father Name */}
                          <td className="py-3.5 pr-4 text-xs font-medium text-slate-600">
                            {s.father_name || "—"}
                          </td>

                          {/* Guardian Phone */}
                          <td className="py-3.5 pr-4 text-xs font-medium text-slate-600">
                            {s.guardian_phone || "—"}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 pr-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                s.status === "active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : "—"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 text-right">
                            <div className="inline-flex items-center gap-2">
                              <Link
                                href={`/finance/students/${s.id}`}
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:border-slate-400 hover:bg-slate-50"
                              >
                                Profile →
                              </Link>
                              <form action={setStudentStatus.bind(null, s.id, s.status === "active" ? "left" : "active")}>
                                <button
                                  type="submit"
                                  className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                                    s.status === "active"
                                      ? "text-amber-700 hover:bg-amber-50"
                                      : "text-emerald-700 hover:bg-emerald-50"
                                  }`}
                                >
                                  {s.status === "active" ? "Mark left" : "Mark active"}
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </Shell>
  );
}
