import Link from "next/link";
import { deleteAnnouncement } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Back } from "@/components/ui";
import { MONTHS } from "@/lib/format";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function audienceLabel(audience: string | null | undefined, teacherName?: string | null) {
  switch (audience) {
    case "finance":
      return "Finance";
    case "teachers":
      return "All teachers";
    case "teacher":
      return teacherName ? `Teacher · ${teacherName}` : "Specific teacher";
    case "principal":
      return "Principal";
    default:
      return "All Staff";
  }
}

export default async function AnnouncementHistoryPage() {
  const { supabase, schoolId, readOnly } = await getContext();
  if (!schoolId) redirect("/");

  const { data: items } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, audience, target_teacher_id, created_by, kind, fee_month, fee_year")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  const list = items || [];
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
  const authorMap = Object.fromEntries(
    (teacherRows || []).map((t) => [t.id, { name: t.name, role: t.role }])
  );

  return (
    <Shell role="principal" title="Announcement history">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Back href="/principal/announcements" label="← Announcements" />
          <Link
            href="/principal/announcements/make"
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-rose-700 active:scale-95"
          >
            + Make Announcement
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-800 text-xs font-bold">
                📜
              </span>
              <h3 className="text-sm font-extrabold text-[#0b1f3a]">School Announcement Archives</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {list.length} announcements
            </span>
          </div>

          <ul className="space-y-4">
            {list.map((item) => {
              const recipient = audienceLabel(
                item.audience,
                item.target_teacher_id ? teacherName[item.target_teacher_id] : null
              );
              const author = item.created_by ? authorMap[item.created_by] : null;
              const fee =
                item.kind === "fee_open" && item.fee_month && item.fee_year
                  ? `${MONTHS[item.fee_month - 1]} ${item.fee_year}`
                  : null;

              return (
                <li
                  key={item.id}
                  className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-5 shadow-2xs transition hover:border-slate-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">To:</span>
                      <b className="text-sm font-black text-[#0b1f3a]">{recipient}</b>
                      {author && (
                        <span className="text-xs text-slate-500 font-medium">
                          · By: <b className="text-slate-800">{author.name}</b>
                          {author.role && (
                            <span className="ml-1 rounded-md bg-slate-200/80 px-1.5 py-0.2 text-[10px] font-bold text-slate-700 capitalize">
                              {author.role}
                            </span>
                          )}
                        </span>
                      )}
                      {fee && (
                        <span className="rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Fee {fee}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {formatDate(item.created_at)}
                      </span>
                      {!readOnly && (
                        <form action={deleteAnnouncement.bind(null, item.id)}>
                          <button
                            type="submit"
                            className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer shadow-2xs"
                          >
                            Delete
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <h4 className="text-sm sm:text-base font-extrabold text-[#0b1f3a]">
                      {item.title}
                    </h4>
                  </div>

                  <div className="mt-2.5 rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-normal shadow-2xs">
                    {item.body}
                  </div>
                </li>
              );
            })}
            {!list.length && <p className="py-8 text-center text-xs text-slate-400">No announcements found.</p>}
          </ul>
        </div>
      </div>
    </Shell>
  );
}
