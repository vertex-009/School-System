import { Shell } from "@/components/shell";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { FinanceAnnouncementsClient, type AnnouncementItem } from "./finance-announcements-client";

export default async function FinanceAnnouncementsPage() {
  const { supabase, profile, schoolId, readOnly } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const { data: items, error } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, audience, created_by, kind, fee_month, fee_year")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

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
        currentUserId={profile.id}
        readOnly={Boolean(readOnly)}
      />
    </Shell>
  );
}
