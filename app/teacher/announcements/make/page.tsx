import { StaffAnnouncementForm } from "@/components/staff-announcement-form";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TeacherMakeAnnouncementPage() {
  const { supabase, profile, schoolId } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("school_id", schoolId)
    .eq("role", "teacher")
    .eq("is_active", true)
    .neq("id", profile.id)
    .order("name");

  return <StaffAnnouncementForm role="teacher" teachers={teachers || []} />;
}
