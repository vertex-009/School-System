"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { removeAssignment } from "@/lib/actions";

export interface AssignmentRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherPhone?: string;
  className: string;
  subjectName: string;
  createdAt?: string;
}

export function ViewAssignmentsClient({
  assignments,
  readOnly,
  assignHref = "/principal/assign",
}: {
  assignments: AssignmentRecord[];
  readOnly?: boolean;
  assignHref?: string;
}) {
  const [search, setSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grouped" | "table">("grouped");
  const [isPending, startTransition] = useTransition();
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  // Unique teachers for filter
  const uniqueTeachers = Array.from(
    new Map(assignments.map((a) => [a.teacherId, { id: a.teacherId, name: a.teacherName }])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Unique classes for filter
  const uniqueClasses = Array.from(new Set(assignments.map((a) => a.className))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  const filtered = assignments.filter((a) => {
    if (removedIds.includes(a.id)) return false;
    if (teacherFilter && a.teacherId !== teacherFilter) return false;
    if (classFilter && a.className !== classFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchTeacher = a.teacherName.toLowerCase().includes(q);
      const matchClass = a.className.toLowerCase().includes(q);
      const matchSub = a.subjectName.toLowerCase().includes(q);
      if (!matchTeacher && !matchClass && !matchSub) return false;
    }
    return true;
  });

  // Group filtered by Teacher
  const groupedByTeacher = new Map<
    string,
    { teacherName: string; teacherPhone?: string; items: AssignmentRecord[] }
  >();
  for (const item of filtered) {
    let group = groupedByTeacher.get(item.teacherId);
    if (!group) {
      group = { teacherName: item.teacherName, teacherPhone: item.teacherPhone, items: [] };
      groupedByTeacher.set(item.teacherId, group);
    }
    group.items.push(item);
  }

  const handleRemove = (id: string, teacherName: string, className: string, subName: string) => {
    if (!confirm(`Are you sure you want to unassign ${teacherName} from ${className} (${subName})?`)) {
      return;
    }
    startTransition(async () => {
      setRemovedIds((prev) => [...prev, id]);
      await removeAssignment(id);
    });
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Search + Filters + View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search teacher, class, subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52 sm:w-64 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-navy focus:bg-white focus:ring-1 focus:ring-brand-navy transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-brand-navy focus:bg-white focus:ring-1 focus:ring-brand-navy transition cursor-pointer"
          >
            <option value="">All Teachers ({uniqueTeachers.length})</option>
            {uniqueTeachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-brand-navy focus:bg-white focus:ring-1 focus:ring-brand-navy transition cursor-pointer"
          >
            <option value="">All Classes ({uniqueClasses.length})</option>
            {uniqueClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs font-bold text-slate-500">
            Total: <b className="text-brand-navy">{filtered.length}</b> assignments
          </span>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grouped")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                viewMode === "grouped" ? "bg-white text-[#0b1f3a] shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
              title="Grouped by Teacher"
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                viewMode === "table" ? "bg-white text-[#0b1f3a] shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
              title="Table view"
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
          <p className="font-bold text-slate-700 text-sm">No record found</p>
          <p className="mt-1 text-xs text-slate-400">
            {search || teacherFilter || classFilter
              ? "No assignments match your search or filter."
              : "No classes have been assigned to teachers yet."}
          </p>
          <Link
            href={assignHref}
            className="mt-4 inline-block rounded-xl bg-[#0b1f3a] px-4 py-2 text-xs font-bold text-white hover:bg-brand-accent transition shadow-xs"
          >
            Assign teacher now →
          </Link>
        </div>
      ) : viewMode === "grouped" ? (
        /* Grouped View: Clean Horizontal Teacher Cards */
        <div className="space-y-3">
          {Array.from(groupedByTeacher.entries()).map(([tId, group]) => (
            <div
              key={tId}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1f3a] font-black text-white text-xs">
                    {group.teacherName.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#0b1f3a]">{group.teacherName}</h3>
                    {group.teacherPhone && (
                      <p className="text-[11px] font-mono text-slate-500">{group.teacherPhone}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                    {group.items.length} {group.items.length === 1 ? "Class" : "Classes"}
                  </span>
                  <Link
                    href={`${assignHref}?teacher_id=${tId}`}
                    className="text-xs font-bold text-brand-navy hover:underline ml-2"
                  >
                    + Assign more
                  </Link>
                </div>
              </div>

              {/* Assigned Class-Subject Badges Grid */}
              <div className="mt-3 flex flex-wrap gap-2">
                {group.items.map((assign) => (
                  <div
                    key={assign.id}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/70 pl-3 pr-2 py-1.5 text-xs transition hover:bg-white hover:border-slate-300 hover:shadow-2xs"
                  >
                    <span className="rounded-md bg-[#0b1f3a] px-2 py-0.5 text-[11px] font-black text-white">
                      {assign.className}
                    </span>
                    <span className="font-bold text-slate-800">{assign.subjectName}</span>
                    {!readOnly && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          handleRemove(assign.id, group.teacherName, assign.className, assign.subjectName)
                        }
                        className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                        title="Remove assignment"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View: Crisp Directory Table */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 pl-5 pr-3">Teacher</th>
                  <th className="px-3 py-3">Phone</th>
                  <th className="px-3 py-3">Class</th>
                  <th className="px-3 py-3">Subject</th>
                  <th className="py-3 pl-3 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pl-5 pr-3 font-bold text-[#0b1f3a]">{row.teacherName}</td>
                    <td className="px-3 py-3 font-mono text-slate-500">{row.teacherPhone || "—"}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-lg bg-[#0b1f3a]/10 px-2 py-0.5 text-xs font-bold text-[#0b1f3a]">
                        {row.className}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-800">{row.subjectName}</td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      {!readOnly && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleRemove(row.id, row.teacherName, row.className, row.subjectName)
                          }
                          className="font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                        >
                          Remove ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
