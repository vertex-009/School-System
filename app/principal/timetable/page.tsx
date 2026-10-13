import Link from "next/link";
import { redirect } from "next/navigation";
import { publishTimetable } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card, Submit } from "@/components/ui";
import { getContext } from "@/lib/session";

export default async function PrincipalTimetableHub() {
  const { supabase, schoolId, readOnly } = await getContext();
  if (!schoolId) redirect("/");

  const [{ data: settings }, { count: draftCount }, { count: pubCount }] = await Promise.all([
    supabase.from("timetable_settings").select("status, generated_at, teacher_count").eq("school_id", schoolId).maybeSingle(),
    supabase
      .from("timetable_slots")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("plan_status", "draft"),
    supabase
      .from("timetable_slots")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("plan_status", "published"),
  ]);

  const status = (settings as { status?: string } | null)?.status || "draft";

  return (
    <Shell role="principal" title="Timetable">
      <p className="text-sm text-slate-600">
        Flow: Generate (virtual T slots) → Assign teachers → Publish. Status:{" "}
        <span className="font-bold text-brand-navy">{status}</span>
        {draftCount != null && ` · Draft lessons: ${draftCount}`}
        {pubCount != null && ` · Published: ${pubCount}`}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link
          href="/principal/timetable/make"
          className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-brand-sky hover:shadow-sm"
        >
          <p className="text-lg font-bold text-brand-navy">1. Generate</p>
          <p className="mt-2 text-sm text-slate-500">
            Settings, class subjects, feasibility. Creates a draft with virtual teacher slots (T1…).
          </p>
        </Link>
        <Link
          href="/principal/timetable/assign-teachers"
          className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-brand-sky hover:shadow-sm"
        >
          <p className="text-lg font-bold text-brand-navy">2. Assign teachers</p>
          <p className="mt-2 text-sm text-slate-500">
            Map each T slot to a real teacher. Builds teacher_assignments for marks & attendance.
          </p>
        </Link>
        <Link
          href="/principal/timetable/view"
          className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-brand-sky hover:shadow-sm"
        >
          <p className="text-lg font-bold text-brand-navy">3. Preview / view</p>
          <p className="mt-2 text-sm text-slate-500">Class-wise weekly grid (draft or published).</p>
        </Link>
        <Card title="4. Publish">
          {readOnly ? (
            <p className="text-sm text-slate-500">Read only.</p>
          ) : (
            <form
              action={async () => {
                "use server";
                const r = await publishTimetable();
                if (r?.error) throw new Error(r.error);
              }}
            >
              <p className="mb-3 text-xs text-slate-500">
                Teachers see My timetable only after publish. Unassigned T slots show a warning.
              </p>
              <Submit>Publish timetable</Submit>
            </form>
          )}
        </Card>
      </div>
    </Shell>
  );
}
