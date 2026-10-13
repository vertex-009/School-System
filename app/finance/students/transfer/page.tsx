import Link from "next/link";
import { transferClass } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Back, Card, Select, Submit } from "@/components/ui";
import { primarySectionIdByClass } from "@/lib/class-label";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ClassTransferPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; done?: string; count?: string; warn?: string }>;
}) {
  const { class: classId = "", done, count } = await searchParams;
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

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
    <Shell role="finance" title="Transfer">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Back href="/finance/students" label="← Back" />
        <Link href="/finance/students/school-transfer" className="text-xs font-bold text-brand-accent hover:underline">
          School →
        </Link>
      </div>

      {done === "1" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          Done{count ? ` · ${count}` : ""}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {classOptions.map((c) => {
          const n = countByClass.get(c.id) || 0;
          const active = c.id === activeClassId;
          return (
            <Link
              key={c.id}
              href={`/finance/students/transfer?class=${c.id}`}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                active
                  ? "bg-brand-navy text-white shadow-sm"
                  : "border border-slate-200 bg-white text-brand-navy hover:border-brand-sky hover:bg-slate-50"
              }`}
            >
              {c.name}
              <span className={`ml-2 text-xs font-semibold ${active ? "text-white/70" : "text-slate-500"}`}>({n})</span>
            </Link>
          );
        })}
      </div>

      {activeClass && (
        <>
          <Card title={activeClass.name}>
            {students.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="py-2 pr-3 font-semibold">Roll</th>
                      <th className="py-2 pr-3 font-semibold">Name</th>
                      <th className="py-2 pr-3 font-semibold">Father</th>
                      <th className="py-2 pr-3 font-semibold">Adm</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2.5 pr-3 tabular-nums text-slate-600">{s.roll_no ?? "—"}</td>
                        <td className="py-2.5 pr-3 font-bold text-brand-navy">{s.name}</td>
                        <td className="py-2.5 pr-3 text-slate-600">{s.father_name || "—"}</td>
                        <td className="py-2.5 pr-3 text-slate-600">{s.admission_no}</td>
                        <td className="py-2.5 text-right">
                          <Link href={`/finance/students/${s.id}`} className="text-xs font-bold text-brand-accent hover:underline">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {students.length > 0 && targetClasses.length > 0 && (
            <Card title="Transfer">
              <form
                action={async (fd) => {
                  "use server";
                  const r = await transferClass(fd);
                  if (r?.error) throw new Error(r.error);
                }}
                className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
              >
                <input type="hidden" name="from_class_id" value={activeClass.id} />
                <Select label="To" name="to_class_id" required defaultValue={suggestedToId || ""}>
                  <option value="" disabled>
                    —
                  </option>
                  {targetClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <Submit>Transfer</Submit>
              </form>
            </Card>
          )}
        </>
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
