import { Shell } from "@/components/shell";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { TeacherAnnouncementsClient, type TeacherAnnouncementItem } from "./teacher-announcements-client";

export default async function TeacherAnnouncementsPage() {
  const { supabase, profile, schoolId, readOnly } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const [{ data: items, error }, { data: teachers }] = await Promise.all([
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

  for (const t of teachers || []) {
    profileMap[t.id] = { name: t.name, role: t.role };
    if (t.role === "teacher") {
      teachersList.push({ id: t.id, name: t.name });
    }
  }

  const list = (items || []) as TeacherAnnouncementItem[];
  const received = list.filter((item) => {
    const a = item.audience || "all";
    if (a === "all" || a === "teachers") return true;
    if (a === "teacher") return item.target_teacher_id === profile.id;
    return false;
  });
  const sent = list.filter((item) => item.created_by === profile.id);

  return (
    <Shell role="teacher" title="Announcements">
      <TeacherAnnouncementsClient
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
