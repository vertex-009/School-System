"use client";

import { useState } from "react";
import Link from "next/link";
import { transferClass } from "@/lib/actions";
import { Card, Select, Submit } from "@/components/ui";

type StudentItem = {
  id: string;
  name: string;
  admission_no: string;
  roll_no: number | null;
  father_name: string | null;
};

type ClassOption = {
  id: string;
  name: string;
};

export function ClassTransferForm({
  students,
  activeClass,
  targetClasses,
  suggestedToId,
}: {
  students: StudentItem[];
  activeClass: { id: string; name: string };
  targetClasses: ClassOption[];
  suggestedToId: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(students.map((s) => s.id))
  );

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  }

  const allSelected = students.length > 0 && selectedIds.size === students.length;
  const noneSelected = selectedIds.size === 0;
  const detainedCount = students.length - selectedIds.size;

  return (
    <Card
      title={`${activeClass.name} · Student Promotion Roster`}
      subtitle="Uncheck any student who failed or needs to be retained in this class."
    >
      <form
        action={async (fd) => {
          const r = await transferClass(fd);
          if (r?.error) alert(r.error);
        }}
        className="space-y-4"
      >
        <input type="hidden" name="from_class_id" value={activeClass.id} />

        {/* Selected student IDs as hidden inputs */}
        {Array.from(selectedIds).map((id) => (
          <input key={id} type="hidden" name="student_ids" value={id} />
        ))}

        {/* Selection Stats and Master Toggle Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs font-semibold">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = !allSelected && !noneSelected;
              }}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-slate-300 text-brand-navy focus:ring-brand-sky"
            />
            <span className="font-bold text-slate-800">
              {allSelected ? "All students selected for promotion" : "Select / Deselect all"}
            </span>
          </label>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800">
              ✓ {selectedIds.size} Passing / Promoted
            </span>
            {detainedCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 font-bold text-amber-900">
                ✗ {detainedCount} Failed / Retained
              </span>
            )}
          </div>
        </div>

        {/* Students Table with Individual Checkboxes */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
              <tr>
                <th className="py-2.5 pl-3 pr-2 w-10 text-center">
                  <span className="sr-only">Select</span>
                </th>
                <th className="py-2.5 pr-3">Roll</th>
                <th className="py-2.5 pr-3">Name</th>
                <th className="py-2.5 pr-3">Father Name</th>
                <th className="py-2.5 pr-3">Adm No.</th>
                <th className="py-2.5 pr-3">Promotion Status</th>
                <th className="py-2.5 pr-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {students.map((s) => {
                const isPromoting = selectedIds.has(s.id);
                return (
                  <tr
                    key={s.id}
                    onClick={() => toggleOne(s.id)}
                    className={`cursor-pointer transition select-none ${
                      isPromoting
                        ? "hover:bg-sky-50/40"
                        : "bg-rose-50/30 hover:bg-rose-50/60 opacity-80"
                    }`}
                  >
                    <td className="py-2.5 pl-3 pr-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isPromoting}
                        onChange={() => toggleOne(s.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-navy focus:ring-brand-sky cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums font-semibold text-slate-700">
                      {s.roll_no ?? "—"}
                    </td>
                    <td className="py-2.5 pr-3 font-bold text-brand-navy">{s.name}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{s.father_name || "—"}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-slate-600">{s.admission_no}</td>
                    <td className="py-2.5 pr-3">
                      {isPromoting ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Promoting
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          Failed (Stays in {activeClass.name})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/finance/students/${s.id}`}
                        target="_blank"
                        className="text-xs font-bold text-brand-accent hover:underline"
                      >
                        Profile
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Transfer Action Controls */}
        {targetClasses.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs mt-4">
            <h3 className="text-sm font-bold text-brand-navy mb-2">Destination Class</h3>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Select label="Promote selected students to:" name="to_class_id" required defaultValue={suggestedToId || ""}>
                <option value="" disabled>
                  Select destination class
                </option>
                {targetClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Submit>
                {selectedIds.size > 0
                  ? `Promote ${selectedIds.size} Students →`
                  : "Select at least 1 student"}
              </Submit>
            </div>
            {detainedCount > 0 && (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Note: {detainedCount} unchecked student(s) will remain in {activeClass.name}.
              </p>
            )}
          </div>
        )}
      </form>
    </Card>
  );
}

