import { StaffAnnouncementForm } from "@/components/staff-announcement-form";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TeacherMakeAnnouncementPage() {
  const { profile, schoolId } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");
  return <StaffAnnouncementForm role="teacher" />;
}
