import Link from "next/link";

export function ClassChipBar({
  classes,
  activeSectionId,
  basePath,
  extraQuery = "",
}: {
  classes: { sectionId: string; label: string; subjects?: string[] }[];
  activeSectionId: string;
  basePath: string;
  /** e.g. `&date=2026-10-10` */
  extraQuery?: string;
}) {
  if (!classes.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        No classes assigned yet. Wait for Principal to assign you or publish the timetable.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {classes.map((c) => {
        const active = c.sectionId === activeSectionId;
        const href = `${basePath}?section_id=${c.sectionId}${extraQuery}`;
        return (
          <Link
            key={c.sectionId}
            href={href}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              active
                ? "bg-brand-navy text-white shadow-sm"
                : "border border-slate-200 bg-white text-brand-navy hover:border-brand-sky hover:bg-slate-50"
            }`}
            title={c.subjects?.length ? c.subjects.join(", ") : undefined}
          >
            {c.label}
            {c.subjects?.length ? (
              <span className={`ml-2 text-[10px] font-semibold ${active ? "text-white/70" : "text-slate-400"}`}>
                {c.subjects.length} subj
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
