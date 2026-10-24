import { Shell } from "@/components/shell";
import { AssignNavTabs } from "@/components/assign-nav-tabs";
import { ViewAssignmentsClient, type AssignmentRecord } from "@/app/principal/assign/view/view-assignments-client";
import { classNameOf } from "@/lib/class-label";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function FinanceViewAssignmentsPage() {
  const { supabase, schoolId, readOnly, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const { data: assignments } = await supabase
    .from("teacher_assignments")
    .select("id, teacher_id, created_at, profiles(id, name, phone), sections(id, name, classes(name)), subjects(id, name)")
    .eq("school_id", schoolId);

  const mapped: AssignmentRecord[] = (assignments || []).map((a) => {
    const prof = a.profiles as { id?: string; name?: string; phone?: string } | null;
    const sub = a.subjects as { id?: string; name?: string } | null;
    return {
      id: a.id,
      teacherId: a.teacher_id,
      teacherName: prof?.name || "Teacher",
      teacherPhone: prof?.phone || undefined,
      className: classNameOf(a.sections),
      subjectName: sub?.name || "Subject",
      createdAt: a.created_at || undefined,
    };
  });

  return (
    <Shell role="finance" title="Teacher assignments">
      <div className="space-y-4">
        {/* Quick Links Navigation: Assign teacher | View */}
        <AssignNavTabs activeTab="view" basePath="/finance/assign" />

        <ViewAssignmentsClient assignments={mapped} readOnly={readOnly} assignHref="/finance/assign" />
      </div>
    </Shell>
  );
}

