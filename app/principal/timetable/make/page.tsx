import Link from "next/link";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/session";
import { mergeSettings } from "@/lib/timetable/defaults";
import { MakeTimetableForm } from "./form";

export default async function MakeTimetablePage() {
  const { supabase, schoolId, readOnly } = await getContext();
  if (!schoolId) redirect("/");

  const [{ data: settingsRow }, { data: classesRaw }, { data: sectionsRaw }, { data: subjectsRaw }] = await Promise.all([
    supabase.from("timetable_settings").select("*").eq("school_id", schoolId).maybeSingle(),
    supabase.from("classes").select("id, name, sort_order").eq("school_id", schoolId).order("sort_order").order("name"),
    supabase.from("sections").select("id, class_id").eq("school_id", schoolId),
    supabase.from("subjects").select("id, name").eq("school_id", schoolId).order("name"),
  ]);

  const settings = mergeSettings(settingsRow as any);
  const sectionsByClass = new Map<string, number>();
  for (const s of sectionsRaw || []) {
    sectionsByClass.set(s.class_id, (sectionsByClass.get(s.class_id) || 0) + 1);
  }

  const classes = (classesRaw || []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    sectionCount: sectionsByClass.get(c.id) || 0,
  }));

  const schoolSubjects = (subjectsRaw || []).map((s) => ({ id: s.id as string, name: s.name as string }));

  return (
    <MakeTimetableForm
      readOnly={readOnly}
      settings={settings}
      classes={classes}
      schoolSubjects={schoolSubjects}
      back={
        <Link href="/principal/timetable" className="text-xs font-bold text-brand-accent hover:underline">
          ← Timetable
        </Link>
      }
    />
  );
}
