import Link from "next/link";
import { Shell } from "@/components/shell";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { NewStudentForm } from "./form";

export default async function NewStudentPage() {
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");
  const [{ data: classes }, { data: existingStudents }] = await Promise.all([
    supabase
      .from("classes")
      .select("id, name, fee_structure(monthly_fee)")
      .eq("school_id", schoolId)
      .order("sort_order")
      .order("name"),
    supabase
      .from("students")
      .select("admission_no")
      .eq("school_id", schoolId),
  ]);

  let maxNum = 0;
  for (const s of existingStudents || []) {
    if (!s.admission_no) continue;
    const trimmed = String(s.admission_no).trim();
    const asNum = parseInt(trimmed, 10);
    if (!isNaN(asNum) && String(asNum) === trimmed) {
      if (asNum > maxNum) maxNum = asNum;
    } else {
      const matches = trimmed.match(/\d+/g);
      if (matches) {
        for (const m of matches) {
          const n = parseInt(m, 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }
      }
    }
  }

  const nextNum = maxNum > 0 ? maxNum + 1 : (existingStudents?.length || 0) + 1;
  const defaultAdmissionNo = `ADM-${nextNum}`;

  return (
    <Shell role="finance" title="Add Student">
      <Link href="/finance/students" className="text-xs font-bold text-brand-accent hover:underline">
        ← Students Directory
      </Link>
      <NewStudentForm classes={classes || []} defaultAdmissionNo={defaultAdmissionNo} />
    </Shell>
  );
}
