import Link from "next/link";
import { redirect } from "next/navigation";
import { AssignTeachersForm } from "./form";
import { getContext } from "@/lib/session";

export default async function AssignTeachersPage() {
  const { supabase, schoolId, readOnly } = await getContext();
  if (!schoolId) redirect("/");

  const [{ data: meta }, { data: slots }, { data: teachers }, { data: sections }] = await Promise.all([
    supabase.from("timetable_teacher_slots").select("slot_no, label, subject_name").eq("school_id", schoolId).order("slot_no"),
    supabase
      .from("timetable_slots")
      .select("teacher_slot, teacher_id, section_id, subject_id, day_of_week, period_number, subjects(name), sections(classes(name))")
      .eq("school_id", schoolId)
      .eq("plan_status", "draft"),
    supabase
      .from("profiles")
      .select("id, name")
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .eq("is_active", true)
      .order("name"),
    supabase.from("sections").select("id, classes(name)").eq("school_id", schoolId),
  ]);

  const classNameBySection = new Map<string, string>();
  for (const s of sections || []) {
    const cn = (s.classes as { name?: string } | null)?.name;
    if (cn) classNameBySection.set(s.id, cn);
  }

  type SlotAgg = {
    slot_no: number;
    label: string;
    subject_name: string;
    classes: string[];
    periods: number;
    teacher_id: string | null;
  };

  const bySlot = new Map<number, SlotAgg>();
  for (const m of meta || []) {
    bySlot.set(m.slot_no, {
      slot_no: m.slot_no,
      label: m.label || `T${m.slot_no}`,
      subject_name: m.subject_name || "—",
      classes: [],
      periods: 0,
      teacher_id: null,
    });
  }

  for (const row of slots || []) {
    const sn = row.teacher_slot;
    let agg = bySlot.get(sn);
    if (!agg) {
      agg = {
        slot_no: sn,
        label: `T${sn}`,
        subject_name: (row.subjects as { name?: string } | null)?.name || "—",
        classes: [],
        periods: 0,
        teacher_id: row.teacher_id,
      };
      bySlot.set(sn, agg);
    }
    agg.periods += 1;
    if (row.teacher_id) agg.teacher_id = row.teacher_id;
    const cn =
      classNameBySection.get(row.section_id) ||
      ((row.sections as { classes?: { name?: string } } | null)?.classes?.name ?? "");
    if (cn && !agg.classes.includes(cn)) agg.classes.push(cn);
  }

  const rows = Array.from(bySlot.values()).sort((a, b) => a.slot_no - b.slot_no);

  return (
    <div>
      <AssignTeachersForm
        readOnly={readOnly}
        teachers={(teachers || []).map((t) => ({ id: t.id, name: t.name }))}
        slots={rows}
        back={
          <Link href="/principal/timetable" className="text-xs font-bold text-brand-accent hover:underline">
            ← Timetable
          </Link>
        }
      />
    </div>
  );
}
