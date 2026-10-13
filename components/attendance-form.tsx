"use client";

import { useState } from "react";
import { saveAttendance } from "@/lib/actions";

export function AttendanceForm({
  date,
  sectionId,
  students,
  existing,
}: {
  date: string;
  sectionId: string;
  students: { id: string; name: string; admission_no: string; roll_no?: number | null }[];
  existing: Record<string, string>;
}) {
  const [rows, setRows] = useState(() =>
    students.map((s) => ({ student_id: s.id, status: existing[s.id] || "present" }))
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending) return;
        setPending(true);
        setError("");
        setMessage("");
        try {
          await saveAttendance(rows.map((r) => ({ ...r, section_id: sectionId, date })));
          setMessage(Object.keys(existing).length ? "Attendance updated." : "Attendance saved.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not save");
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-slate-500">
              <th className="py-2 pr-2 font-semibold">Roll</th>
              <th className="py-2 pr-2 font-semibold">Name</th>
              <th className="py-2 pr-2 font-semibold">Adm</th>
              <th className="py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student, index) => (
              <tr key={student.id}>
                <td className="py-2 pr-2 tabular-nums text-slate-600">{student.roll_no ?? "—"}</td>
                <td className="py-2 pr-2 font-bold text-brand-navy">{student.name}</td>
                <td className="py-2 pr-2 text-slate-500">{student.admission_no}</td>
                <td className="py-2">
                  <select
                    value={rows[index]?.status || "present"}
                    onChange={(e) =>
                      setRows((c) => c.map((r, i) => (i === index ? { ...r, status: e.target.value } : r)))
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="leave">Leave</option>
                    <option value="late">Late</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent disabled:opacity-60"
      >
        {pending ? "Saving…" : Object.keys(existing).length ? "Update attendance" : "Save attendance"}
      </button>
      {message && <p className="text-xs font-bold text-emerald-700">{message}</p>}
      {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
    </form>
  );
}
