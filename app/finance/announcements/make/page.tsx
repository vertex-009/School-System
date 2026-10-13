import { StaffAnnouncementForm } from "@/components/staff-announcement-form";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function FinanceMakeAnnouncementPage() {
  const { profile, schoolId } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");
  return <StaffAnnouncementForm role="finance" />;
}
