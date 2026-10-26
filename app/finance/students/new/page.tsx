import Link from "next/link";
import { Shell } from "@/components/shell";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { NewStudentForm } from "./form";

export default async function NewStudentPage() {
  const { supabase, schoolId, profile } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, fee_structure(monthly_fee)")
    .eq("school_id", schoolId)
    .order("sort_order")
    .order("name");

  return (
    <Shell role="finance" title="Add Student">
      <Link href="/finance/students" className="text-xs font-bold text-brand-accent hover:underline">
        ← Students Directory
      </Link>
      <NewStudentForm classes={classes || []} />
    </Shell>
  );
}
