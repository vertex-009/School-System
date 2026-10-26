import { Shell } from "@/components/shell";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { FinanceAnnouncementsClient, type AnnouncementItem } from "./finance-announcements-client";

export default async function FinanceAnnouncementsPage() {
  const { supabase, profile, schoolId, readOnly } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const [{ data: items }, { data: profiles }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, body, created_at, audience, target_teacher_id, created_by, kind, fee_month, fee_year")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, name, role")
      .eq("school_id", schoolId),
  ]);

  const profileMap: Record<string, { name: string; role: string }> = {};
  const teachersList: { id: string; name: string }[] = [];

  for (const p of profiles || []) {
    profileMap[p.id] = { name: p.name || "Staff", role: p.role || "" };
    if (p.role === "teacher") {
      teachersList.push({ id: p.id, name: p.name || "Teacher" });
    }
  }

  // Sort teachers alphabetically
  teachersList.sort((a, b) => a.name.localeCompare(b.name));

  const list = (items || []) as AnnouncementItem[];
  const received = list.filter((item) => {
    const a = item.audience || "all";
    return a === "all" || a === "finance";
  });
  const sent = list.filter((item) => item.created_by === profile.id);

  return (
    <Shell role="finance" title="Announcements">
      <FinanceAnnouncementsClient
        received={received}
        sent={sent}
        teachersList={teachersList}
        profileMap={profileMap}
        currentUserId={profile.id}
        readOnly={Boolean(readOnly)}
      />
    </Shell>
  );
}
