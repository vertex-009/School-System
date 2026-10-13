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
    case "all":
      return "Everyone";
    default:
      return audience || "Notice";
  }
}

function feeMonthLabel(kind: string | null | undefined, month: number | null | undefined, year: number | null | undefined) {
  if (kind !== "fee_open" || !month || !year) return null;
  return `${MONTHS[month - 1]} ${year}`;
}

export default async function FinanceAnnouncementsPage() {
  const { supabase, profile, schoolId, readOnly } = await getContext();
  if (profile.role !== "finance" || !schoolId) redirect("/");

  const { data: items, error } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, audience, created_by, kind, fee_month, fee_year")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  const list = items || [];
  const received = list.filter((item) => {
    const a = item.audience || "all";
    return a === "all" || a === "finance";
  });
  const sent = list.filter((item) => item.created_by === profile.id);

  return (
    <Shell role="finance" title="Announcement history">
      <p className="text-sm text-slate-600">Notices for Finance and messages you sent (including fee collection open).</p>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Run <code className="font-mono text-xs">migration_fee_announcement.sql</code> if fee columns are missing.
        </div>
      )}

      <Card title="Received" subtitle={`${received.length} posts`}>
        <ul className="space-y-3">
          {received.map((item) => {
            const fee = feeMonthLabel(item.kind, item.fee_month, item.fee_year);
            return (
              <li key={item.id} className="rounded-2xl border border-slate-100 p-4 text-sm">
                <b className="text-brand-navy">{item.title}</b>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {audienceLabel(item.audience)}
                  {fee ? ` · Fee month ${fee}` : ""}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-slate-600">{item.body}</p>
                <p className="mt-2 text-[11px] text-slate-400">{new Date(item.created_at).toLocaleString()}</p>
              </li>
            );
          })}
          {!received.length && <p className="text-sm text-slate-500">No announcements for Finance yet.</p>}
        </ul>
      </Card>

      <Card title="Sent by you" subtitle={`${sent.length} posts`}>
        <ul className="space-y-3">
          {sent.map((item) => {
            const fee = feeMonthLabel(item.kind, item.fee_month, item.fee_year);
            return (
              <li key={item.id} className="rounded-2xl border border-slate-100 p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <b className="text-brand-navy">{item.title}</b>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {audienceLabel(item.audience)}
                      {fee ? ` · Fee month ${fee}` : ""}
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
            );
          })}
          {!sent.length && <p className="text-sm text-slate-500">You have not sent any announcements yet.</p>}
        </ul>
      </Card>
    </Shell>
  );
}
