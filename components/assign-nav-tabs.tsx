import Link from "next/link";

export function AssignNavTabs({
  activeTab,
  basePath = "/principal/assign",
}: {
  activeTab: "assign" | "view";
  basePath?: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 pb-3 print:hidden">
      <Link
        href={basePath}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
          activeTab === "assign"
            ? "bg-[#0b1f3a] text-white"
            : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Assign teacher</span>
      </Link>

      <Link
        href={`${basePath}/view`}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
          activeTab === "view"
            ? "bg-[#0b1f3a] text-white"
            : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>View assignments</span>
      </Link>
    </div>
  );
}
