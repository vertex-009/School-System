import Link from "next/link";
import { Shell } from "@/components/shell";
import { Back, Card } from "@/components/ui";
import { primarySectionIdByClass } from "@/lib/class-label";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { ClassTransferForm } from "@/app/finance/students/transfer/class-transfer-form";

export default async function PrincipalClassTransferPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; done?: string; count?: string; warn?: string }>;
}) {
  const { class: classId = "", done, count } = await searchParams;
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "principal" || !schoolId) redirect("/");

  // Classes/sections first (need section ids for the class-scoped student query).
  const [{ data: classes }, { data: sections }, { data: allActive }, { data: recent }] = await Promise.all([
    supabase.from("classes").select("id, name, sort_order").eq("school_id", schoolId).order("sort_order").order("name"),
    supabase.from("sections").select("id, class_id, name").eq("school_id", schoolId),
    supabase.from("students").select("id, section_id").eq("school_id", schoolId).eq("status", "active"),
    supabase
      .from("student_transfers")
      .select("id, from_class_name, to_class_name, to_school_name, transfer_kind, reason, transferred_at, students(name, admission_no)")
      .eq("school_id", schoolId)
      .order("transferred_at", { ascending: false })
      .limit(20),
  ]);

  const primaryByClass = primarySectionIdByClass(sections || []);
  const classOptions = (classes || []).filter((c) => primaryByClass.has(c.id));
  const activeClassId = classId && classOptions.some((c) => c.id === classId) ? classId : "";
  const activeClass = classOptions.find((c) => c.id === activeClassId) || null;

  let suggestedToId = "";
  if (activeClass) {
    const idx = classOptions.findIndex((c) => c.id === activeClass.id);
    if (idx >= 0 && idx < classOptions.length - 1) suggestedToId = classOptions[idx + 1].id;
  }

  const fromSectionIds = activeClassId
    ? (sections || []).filter((s) => s.class_id === activeClassId).map((s) => s.id)
    : [];

  const { data: classStudents } = fromSectionIds.length
    ? await supabase
        .from("students")
        .select("id, name, admission_no, roll_no, father_name")
        .eq("school_id", schoolId)
        .eq("status", "active")
        .in("section_id", fromSectionIds)
        .order("roll_no", { ascending: true, nullsFirst: false })
        .order("name")
    : { data: [] as { id: string; name: string; admission_no: string; roll_no: number | null; father_name: string | null }[] };
  const students = classStudents || [];

  const countBySection = new Map<string, number>();
  for (const s of allActive || []) {
    if (!s.section_id) continue;
    countBySection.set(s.section_id, (countBySection.get(s.section_id) || 0) + 1);
  }
  const countByClass = new Map<string, number>();
  for (const sec of sections || []) {
    countByClass.set(sec.class_id, (countByClass.get(sec.class_id) || 0) + (countBySection.get(sec.id) || 0));
  }

  const targetClasses = classOptions.filter((c) => c.id !== activeClassId);

  return (
    <Shell role="principal" title="Class Transfer & Promotion">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Back href="/principal/students" label="← Students Directory" />
      </div>

      {done === "1" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          Transfer completed successfully{count ? ` · ${count} student(s) promoted` : ""}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {classOptions.map((c) => {
          const n = countByClass.get(c.id) || 0;
          const active = c.id === activeClassId;
          return (
            <Link
              key={c.id}
              href={`/principal/students/transfer?class=${c.id}`}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                active
                  ? "bg-[#0b1f3a] text-white shadow-sm"
                  : "border border-slate-200 bg-white text-[#0b1f3a] hover:border-sky-400 hover:bg-slate-50"
              }`}
            >
              {c.name}
              <span className={`ml-2 text-xs font-semibold ${active ? "text-white/70" : "text-slate-500"}`}>({n})</span>
            </Link>
          );
        })}
      </div>

      {activeClass && (
        <ClassTransferForm
          students={students}
          activeClass={activeClass}
          targetClasses={targetClasses}
          suggestedToId={suggestedToId}
        />
      )}

      {(recent || []).length > 0 && (
        <Card title="History">
          <ul className="divide-y divide-slate-100 text-sm">
            {(recent || []).map((t) => {
              const s = t.students as { name?: string } | null;
              const dest =
                t.transfer_kind === "external"
                  ? t.to_school_name || "—"
                  : `${t.from_class_name || "—"} → ${t.to_class_name || "—"}`;
              return (
                <li key={t.id} className="flex justify-between gap-2 py-2">
                  <span>
                    <b>{s?.name || "—"}</b>
                    <span className="text-slate-500"> · {dest}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </Shell>
  );
}

