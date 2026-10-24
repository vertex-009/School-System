import { Shell } from "@/components/shell";
import { AssignNavTabs } from "@/components/assign-nav-tabs";
import { AssignTeacherForm, type TeacherItem, type ClassOption, type SubjectItem } from "@/app/principal/assign/assign-form";
import { primarySectionIdByClass, classNameOf } from "@/lib/class-label";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function FinanceAssignPage({
  searchParams,
}: {
  searchParams?: Promise<{ teacher_id?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const preselectedTeacherId = sp.teacher_id || "";

  const { supabase, schoolId, readOnly, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const [
    { data: teachers },
    { data: classes },
    { data: sections },
    { data: subjects },
    { data: assignments },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, phone")
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", schoolId)
      .order("sort_order")
      .order("name"),
    supabase
      .from("sections")
      .select("id, name, class_id, classes(id, name)")
      .eq("classes.school_id", schoolId),
    supabase
      .from("subjects")
      .select("id, name")
      .eq("school_id", schoolId)
      .order("name"),
    supabase
      .from("teacher_assignments")
      .select("id, teacher_id, sections(id, name, classes(name)), subjects(id, name)")
      .eq("school_id", schoolId),
  ]);

  const secMap = primarySectionIdByClass(sections || []);

  const classOptions: ClassOption[] = [];
  for (const c of classes || []) {
    let secId = secMap.get(c.id);
    if (!secId) {
      const matched = (sections || []).find((s) => s.class_id === c.id);
      if (matched) {
        secId = matched.id;
      } else {
        const { data: newSec } = await supabase
          .from("sections")
          .insert({ class_id: c.id, name: "-" })
          .select("id")
          .single();
        secId = newSec?.id;
      }
    }
    if (secId) {
      classOptions.push({
        id: c.id,
        name: c.name,
        sectionId: secId,
      });
    }
  }

  const teacherItems: TeacherItem[] = (teachers || []).map((t) => {
    const tAssigns = (assignments || [])
      .filter((a) => a.teacher_id === t.id)
      .map((a) => ({
        id: a.id,
        className: classNameOf(a.sections),
        subjectName: (a.subjects as { name?: string } | null)?.name || "Subject",
      }));
    return {
      id: t.id,
      name: t.name,
      phone: t.phone || undefined,
      assignments: tAssigns,
    };
  });

  const subjectItems: SubjectItem[] = (subjects || []).map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <Shell role="finance" title="Assign teacher">
      <div className="space-y-4">
        {/* Quick Links Navigation: Assign Teacher | View */}
        <AssignNavTabs activeTab="assign" basePath="/finance/assign" />

        {/* Assign Teacher Form */}
        <AssignTeacherForm
          teachers={teacherItems}
          classes={classOptions}
          subjects={subjectItems}
          initialTeacherId={preselectedTeacherId}
          readOnly={readOnly}
        />
      </div>
    </Shell>
  );
}

