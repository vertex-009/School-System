import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { getContext } from "@/lib/session";
import { ClassImportClient } from "./client";

export default async function ImportPage() {
  const { supabase, schoolId, profile, readOnly } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");
  if (readOnly) redirect("/finance/students");

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("school_id", schoolId)
    .order("sort_order")
    .order("name");

  return (
    <Shell role="finance" title="Import students by class">
      <ClassImportClient classes={classes || []} />
    </Shell>
  );
}
