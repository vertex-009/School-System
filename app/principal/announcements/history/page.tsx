import Link from "next/link";
import { deleteAnnouncement } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Back, Card } from "@/components/ui";
import { MONTHS } from "@/lib/format";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

function audienceLabel(audience: string | null | undefined, teacherName?: string | null) {
  switch (audience) {
    case "finance":
      return "Finance only";
    case "teachers":
      return "All teachers";
    case "teacher":
      return teacherName ? `Teacher · ${teacherName}` : "Specific teacher";
    case "principal":
      return "To Principal";
    default:
      return "Everyone";
  }
}

export default async function AnnouncementHistoryPage() {
  const { supabase, schoolId, readOnly } = await getContext();
  if (!schoolId) redirect("/");

  const { data: items, error } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, audience, target_teacher_id, created_by, kind, fee_month, fee_year")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  const list = error ? [] : items || [];
  const profileIds = [
    ...new Set(
      list
        .flatMap((i) => [i.target_teacher_id, i.created_by])
        .filter(Boolean)
    ),
  ] as string[];
  const { data: teacherRows } =
    profileIds.length > 0
      ? await supabase.from("profiles").select("id, name, role").in("id", profileIds)
      : { data: [] as { id: string; name: string; role?: string }[] };
  const teacherName = Object.fromEntries((teacherRows || []).map((t) => [t.id, t.name]));
  const authorLabel = Object.fromEntries(
    (teacherRows || []).map((t) => [t.id, `${t.name}${t.role ? ` (${t.role})` : ""}`])
  );

  return (
    <Shell role="principal" title="Announcement history">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Back href="/principal/announcements" label="← Announcements" />
        <Link
          href="/principal/announcements/make"
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700"
        >
          + Make Announcement
        </Link>
      </div>

      <p className="text-sm text-slate-600">Past notices and who they were sent to.</p>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          If targeting is missing, run <code className="font-mono text-xs">migration_principal_ui.sql</code> in Supabase.
        </div>
      )}

      <Card title="History" subtitle={`${list.length} posts`}>
        <ul className="space-y-3">
          {list.map((item) => {
            return (
              <li key={item.id} className="rounded-2xl border border-slate-100 p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <b className="text-brand-navy">{item.title}</b>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {audienceLabel(
                        item.audience,
                        item.target_teacher_id ? teacherName[item.target_teacher_id] : null
                      )}
                      {item.created_by && authorLabel[item.created_by]
                        ? ` · From ${authorLabel[item.created_by]}`
                        : ""}
                      {item.kind === "fee_open" && item.fee_month && item.fee_year
                        ? ` · Fee month ${MONTHS[item.fee_month - 1]} ${item.fee_year}`
                        : ""}
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
          {!list.length && <p className="text-sm text-slate-500">No announcements yet.</p>}
        </ul>
      </Card>
    </Shell>
  );
}
