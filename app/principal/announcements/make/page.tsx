import { MakeAnnouncementForm } from "./form";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function MakeAnnouncementPage() {
  const { supabase, schoolId } = await getContext();
  if (!schoolId) redirect("/");
  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("school_id", schoolId)
    .eq("role", "teacher")
    .eq("is_active", true)
    .order("name");
  return <MakeAnnouncementForm teachers={teachers || []} />;
}
