import { removeAssignment } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { NoRecordFound, PeriodFilter } from "@/components/period-filter";
import { Card } from "@/components/ui";
import { classNameOf } from "@/lib/class-label";
import { parsePeriod, periodBounds } from "@/lib/period";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AssignHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const { supabase, schoolId, readOnly } = await getContext();
  if (!schoolId) redirect("/");

  const { monthStart, monthEnd } = periodBounds(period.month, period.year);

  let assignments: {
    id: string;
    created_at?: string;
    profiles?: { name?: string } | null;
    sections?: unknown;
    subjects?: { name?: string } | null;
  }[] = [];
  let queryError: string | null = null;

  if (!period.isFuture) {
    const { data, error } = await supabase
      .from("teacher_assignments")
      .select("id, created_at, profiles(name), sections(name, classes(name)), subjects(name)")
      .eq("school_id", schoolId)
      .gte("created_at", monthStart)
      .lt("created_at", monthEnd)
      .order("created_at", { ascending: false });

    if (error) {
      // Fallback if created_at column missing — show all
      const fallback = await supabase
        .from("teacher_assignments")
        .select("id, profiles(name), sections(name, classes(name)), subjects(name)")
        .eq("school_id", schoolId);
      assignments = (fallback.data || []) as typeof assignments;
      if (error.message.toLowerCase().includes("created_at")) {
        queryError = "Run migration_principal_staff_ui.sql for month filter on assignments.";
      } else {
        queryError = error.message;
      }
    } else {
      assignments = (data || []) as typeof assignments;
    }
  }

  return (
    <Shell role="principal" title="Assignment history">
      <p className="text-sm text-slate-600">Assignments created in the selected month.</p>

      <PeriodFilter period={period} title="Filter by month" submitLabel="Show" />

      {queryError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{queryError}</div>
      )}

      {period.isFuture || !assignments.length ? (
        <NoRecordFound />
      ) : (
        <Card title={`Assignments · ${period.label}`} subtitle={`${assignments.length} record(s)`}>
          <ul className="divide-y divide-slate-100">
            {assignments.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <b className="text-brand-navy">{row.profiles?.name || "Teacher"}</b>
                  <span className="text-slate-600">
                    {" "}
                    · {classNameOf(row.sections)} · {row.subjects?.name || "Subject"}
                  </span>
                  {row.created_at && (
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {new Date(row.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
                {!readOnly && (
                  <form action={removeAssignment.bind(null, row.id)}>
                    <button className="text-xs font-bold text-rose-600">Remove</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Shell>
  );
}
