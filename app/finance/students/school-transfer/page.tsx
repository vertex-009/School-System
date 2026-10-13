import Link from "next/link";
import { transferStudentToSchool } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { StudentProfileCard } from "@/components/student-profile-card";
import { Back, Card, Field, Submit } from "@/components/ui";
import { classNameOf } from "@/lib/class-label";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SchoolTransferPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; student?: string; done?: string }>;
}) {
  const { q = "", student: studentId = "" } = await searchParams;
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  let selected: {
    id: string;
    name: string;
    admission_no: string;
    father_name: string | null;
    guardian_phone: string | null;
    gender: string | null;
    dob: string | null;
    address: string | null;
    roll_no: number | null;
    status: string;
    cnic: string | null;
    sections: unknown;
  } | null = null;

  if (studentId) {
    const { data } = await supabase
      .from("students")
      .select(
        "id, name, admission_no, father_name, guardian_phone, gender, dob, address, roll_no, status, cnic, sections(name, classes(name))"
      )
      .eq("id", studentId)
      .eq("school_id", schoolId)
      .maybeSingle();
    selected = data;
  }

  let searchResults: { id: string; name: string; admission_no: string; sections: unknown }[] = [];
  if (q.trim() && !selected) {
    const { filterStudentsBySearch, studentSearchOr } = await import("@/lib/search");
    const { data } = await supabase
      .from("students")
      .select("id, name, admission_no, father_name, sections(name, classes(name))")
      .eq("school_id", schoolId)
      .eq("status", "active")
      .or(studentSearchOr(q))
      .order("name")
      .limit(40);
    searchResults = filterStudentsBySearch(data || [], q).slice(0, 20);
  }

  return (
    <Shell role="finance" title="School transfer">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Back href="/finance/students" label="← Back to students" />
        <Link href="/finance/students/transfer" className="text-xs font-bold text-brand-accent hover:underline">
          ← Class transfer (whole class)
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-gradient-to-r from-brand-navy to-brand-accent px-5 py-4 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Finance</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">Transfer to another school</p>
        <p className="mt-1 text-xs text-white/75">
          For one student leaving this school. Record is marked left and destination is saved.
        </p>
      </div>

      {!selected ? (
        <Card title="Find student" subtitle="Search the student who is leaving for another school">
          <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block min-w-0 flex-1 text-xs font-bold text-slate-600">
              Search
              <input
                name="q"
                defaultValue={q}
                placeholder="Name, admission no, or father name"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-brand-sky focus:bg-white focus:ring-2 focus:ring-brand-sky/40"
              />
            </label>
            <button type="submit" className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent">
              Search
            </button>
          </form>

          {q.trim() && (
            <ul className="mt-4 divide-y divide-slate-100">
              {searchResults.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-bold text-brand-navy">{s.name}</p>
                    <p className="text-xs text-slate-500">
                      {s.admission_no} · {classNameOf(s.sections)}
                    </p>
                  </div>
                  <Link
                    href={`/finance/students/school-transfer?student=${s.id}`}
                    className="rounded-xl bg-brand-navy px-3 py-2 text-xs font-bold text-white hover:bg-brand-accent"
                  >
                    Select
                  </Link>
                </li>
              ))}
              {!searchResults.length && <p className="mt-3 text-sm text-slate-500">No active students match.</p>}
            </ul>
          )}
        </Card>
      ) : (
        <>
          <Link href="/finance/students/school-transfer" className="text-xs font-bold text-brand-accent hover:underline">
            ← Choose another student
          </Link>

          <StudentProfileCard
            student={{
              name: selected.name,
              father_name: selected.father_name,
              admission_no: selected.admission_no,
              roll_no: selected.roll_no,
              gender: selected.gender,
              dob: selected.dob,
              cnic: selected.cnic,
              guardian_phone: selected.guardian_phone,
              address: selected.address,
              status: selected.status,
              className: classNameOf(selected.sections),
            }}
          />

          {selected.status !== "active" ? (
            <Card title="Already left">
              <p className="text-sm text-slate-600">This student is already marked left / transferred.</p>
            </Card>
          ) : (
            <Card
              title="Destination school"
              subtitle="Student will be marked left. Admission no stays in history for this school."
            >
              <form
                action={async (fd) => {
                  "use server";
                  const r = await transferStudentToSchool(fd);
                  if (r?.error) throw new Error(r.error);
                }}
                className="grid gap-3 md:grid-cols-2"
              >
                <input type="hidden" name="student_id" value={selected.id} />
                <div className="md:col-span-2">
                  <Field
                    label="Transfer to school"
                    name="to_school_name"
                    required
                    placeholder="e.g. City Public School, Abbottabad"
                  />
                </div>
                <label className="block text-xs font-bold text-slate-600 md:col-span-2">
                  Reason / remarks (optional)
                  <textarea
                    name="reason"
                    rows={2}
                    placeholder="e.g. Family relocation…"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-brand-sky focus:bg-white focus:ring-2 focus:ring-brand-sky/40"
                  />
                </label>
                <div className="md:col-span-2">
                  <Submit>Confirm school transfer</Submit>
                </div>
              </form>
            </Card>
          )}
        </>
      )}
    </Shell>
  );
}
