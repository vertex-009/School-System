import Link from "next/link";
import { Shell } from "@/components/shell";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { NewStudentForm } from "@/app/finance/students/new/form";

export default async function PrincipalNewStudentPage() {
  const { supabase, schoolId, profile } = await getContext();
  if (!schoolId || profile.role !== "principal") redirect("/");

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, fee_structure(monthly_fee)")
    .eq("school_id", schoolId)
    .order("sort_order")
    .order("name");

  return (
    <Shell role="principal" title="Add student">
      {/* Quick Action Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2">
          <Link
            href="/principal/students"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-brand-navy"
          >
            <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Student Directory
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-navy px-3.5 py-2 text-xs font-bold text-white shadow-xs">
            <svg className="h-4 w-4 text-sky-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            + Add New Student
          </span>
        </div>

        <Link
          href="/principal/students"
          className="text-xs font-semibold text-brand-navy hover:text-brand-accent transition hover:underline"
        >
          ← Back to Students Overview
        </Link>
      </div>

      <div className="max-w-4xl">
        <NewStudentForm classes={classes || []} role="principal" />
      </div>
    </Shell>
  );
}
