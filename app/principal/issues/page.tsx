import Link from "next/link";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function IssuesPage() {
  const { supabase, schoolId, readOnly } = await getContext();
  if (!schoolId) redirect("/");
  const { data: left } = await supabase
    .from("students")
    .select("id, name, admission_no, father_name, guardian_phone, status, sections(name, classes(name))")
    .eq("school_id", schoolId)
    .eq("status", "left")
    .order("name");

  return (
    <Shell role="principal" title="Student / parent issues">
      <Card title="Important issues" subtitle="Frontend overview — students marked left or needing attention.">
        <ul className="divide-y text-sm">
          {(left || []).map((s) => {
            const sec = s.sections as { name?: string; classes?: { name?: string } } | null;
            return (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <Link href={`/principal/students/${s.id}`} className="font-bold text-blue-700">{s.name}</Link>
                  <p className="text-xs text-slate-500">
                    {s.admission_no} · {sec?.classes?.name || "—"} · Father {s.father_name || "—"} · {s.guardian_phone || "no phone"}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold capitalize text-amber-800">{s.status}</span>
              </li>
            );
          })}
        </ul>
        {!left?.length && <p className="text-sm text-slate-500">No issues listed. When Finance marks a student as left, they show here.</p>}
      </Card>
    </Shell>
  );
}
