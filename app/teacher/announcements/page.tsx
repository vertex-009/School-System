import { deleteAnnouncement } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";
import { MONTHS } from "@/lib/format";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

function audienceLabel(audience: string | null | undefined) {
  switch (audience) {
    case "principal":
      return "To Principal";
    case "finance":
      return "To Finance";
    case "teachers":
      return "To all teachers";
    case "teacher":
      return "To you";
    case "all":
      return "Everyone";
    default:
      return audience || "Notice";
  }
}

export default async function TeacherAnnouncementsPage() {
  const { supabase, profile, schoolId, readOnly } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const { data: items, error } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, audience, target_teacher_id, created_by, kind, fee_month, fee_year")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  const list = items || [];
  const received = list.filter((item) => {
    const a = item.audience || "all";
    if (a === "all" || a === "teachers") return true;
    if (a === "teacher") return item.target_teacher_id === profile.id;
    return false;
  });
  const sent = list.filter((item) => item.created_by === profile.id);

  return (
    <Shell role="teacher" title="Announcement history">
      <p className="text-sm text-slate-600">Notices you received and messages you sent.</p>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Run <code className="font-mono text-xs">migration_staff_announcements.sql</code> if columns are missing.
        </div>
      )}

      <Card title="Received" subtitle={`${received.length} posts`}>
        <ul className="space-y-3">
          {received.map((item) => (
            <li key={item.id} className="rounded-2xl border border-slate-100 p-4 text-sm">
              <b className="text-brand-navy">{item.title}</b>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {audienceLabel(item.audience)}
                {item.kind === "fee_open" && item.fee_month && item.fee_year
                  ? ` · Fee month ${MONTHS[item.fee_month - 1]} ${item.fee_year}`
                  : ""}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-slate-600">{item.body}</p>
              <p className="mt-2 text-[11px] text-slate-400">{new Date(item.created_at).toLocaleString()}</p>
            </li>
          ))}
          {!received.length && <p className="text-sm text-slate-500">No announcements for you yet.</p>}
        </ul>
      </Card>

      <Card title="Sent by you" subtitle={`${sent.length} posts`}>
        <ul className="space-y-3">
          {sent.map((item) => (
            <li key={item.id} className="rounded-2xl border border-slate-100 p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <b className="text-brand-navy">{item.title}</b>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {audienceLabel(item.audience)}
                  </p>
                </div>
                {!readOnly && (
                  <form action={deleteAnnouncement.bind(null, item.id)}>
                    <button className="text-xs font-bold text-rose-600">Delete</button>
                  </form>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-slate-600">{item.body}</p>
              <p className="mt-2 text-[11px] text-slate-400">{new Date(item.created_at).toLocaleString()}</p>
            </li>
          ))}
          {!sent.length && <p className="text-sm text-slate-500">You have not sent any announcements yet.</p>}
        </ul>
      </Card>
    </Shell>
  );
}
