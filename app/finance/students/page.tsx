import Link from "next/link";
import { setStudentStatus } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";
import { classNameOf, primarySectionIdByClass } from "@/lib/class-label";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; class?: string }>;
}) {
  const { q = "", class: classId = "" } = await searchParams;
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const [{ data: classes }, { data: sections }, { count: totalAll }] = await Promise.all([
    supabase.from("classes").select("id, name").eq("school_id", schoolId).order("sort_order").order("name"),
    supabase.from("sections").select("id, name, class_id, classes(name)").eq("school_id", schoolId),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("status", "active"),
  ]);

  const primaryByClass = primarySectionIdByClass(sections || []);
  const classOptions = (classes || []).map((c) => ({
    id: c.id,
    name: c.name,
    sectionId: primaryByClass.get(c.id) || null,
  }));

  let query = supabase
    .from("students")
    .select("id, name, admission_no, father_name, guardian_phone, status, roll_no, section_id, sections(name, classes(name))")
    .eq("school_id", schoolId)
    .order("name");

  if (classId) {
    const sectionIds = (sections || []).filter((s) => s.class_id === classId).map((s) => s.id);
    if (sectionIds.length) query = query.in("section_id", sectionIds);
    else query = query.eq("section_id", "00000000-0000-0000-0000-000000000000");
  }
  if (q.trim()) {
    const { studentSearchOr } = await import("@/lib/search");
    query = query.or(studentSearchOr(q));
  }

  const { data: students } = await query;
  const { filterStudentsBySearch } = await import("@/lib/search");
  const list = q.trim() ? filterStudentsBySearch(students || [], q) : students || [];

  return (
    <Shell role="finance" title="Students">
      <div className="rounded-xl border border-slate-200/80 bg-gradient-to-r from-brand-navy to-brand-accent px-5 py-4 text-white">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Finance</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">Total students</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums">{totalAll ?? 0}</p>
            <p className="text-[11px] font-medium text-white/70">Active on roll</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Link
          href="/finance/students/transfer"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-brand-navy hover:bg-slate-50"
        >
          Class transfer
        </Link>
        <Link
          href="/finance/students/school-transfer"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-brand-navy hover:bg-slate-50"
        >
          School transfer
        </Link>
      </div>

      <Card title="Students" subtitle={`${list.length} shown`}>
        <form method="get" className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1 text-xs font-bold text-slate-600">
            Search
            <input
              name="q"
              defaultValue={q}
              placeholder="Name, admission no, or father name"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-brand-sky focus:bg-white focus:ring-2 focus:ring-brand-sky/40"
            />
          </label>
          <label className="block w-full text-xs font-bold text-slate-600 sm:w-48">
            Class
            <select
              name="class"
              defaultValue={classId}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/40"
            >
              <option value="">All classes</option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent">
            Search
          </button>
        </form>

        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href={q ? `/finance/students?q=${encodeURIComponent(q)}` : "/finance/students"}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${!classId ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-700"}`}
          >
            All
          </Link>
          {classOptions.map((c) => (
            <Link
              key={c.id}
              href={q ? `/finance/students?class=${c.id}&q=${encodeURIComponent(q)}` : `/finance/students?class=${c.id}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                classId === c.id ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {!list.length ? (
          <p className="text-sm text-slate-500">No students match this search.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((student) => (
              <li key={student.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <Link href={`/finance/students/${student.id}`} className="min-w-0 flex-1 hover:opacity-90">
                  <p className="font-bold text-brand-accent underline-offset-2 hover:underline">{student.name}</p>
                  <p className="text-xs text-slate-500">
                    {student.admission_no} · {classNameOf(student.sections)} · {student.status}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-brand-navy">View full profile →</p>
                </Link>
                <div className="flex items-center gap-3">
                  {student.status === "active" && (
                    <Link
                      href={`/finance/students/school-transfer?student=${student.id}`}
                      className="text-xs font-bold text-brand-accent hover:underline"
                    >
                      School transfer
                    </Link>
                  )}
                  <form action={setStudentStatus.bind(null, student.id, student.status === "active" ? "left" : "active")}>
                    <button className="text-xs font-bold text-amber-700">
                      {student.status === "active" ? "Mark left" : "Mark active"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Shell>
  );
}
