"use client";

import { useState } from "react";
import { saveMarks } from "@/lib/actions";

export function MarksForm({
  examId,
  subjectId,
  students,
  existing,
}: {
  examId: string;
  subjectId: string;
  students: { id: string; name: string; roll_no?: number | null; admission_no?: string }[];
  existing: Record<string, { obtained: number; total: number }>;
}) {
  const [rows, setRows] = useState(() =>
    students.map((s) => ({
      student_id: s.id,
      obtained: existing[s.id]?.obtained ?? 0,
      total: existing[s.id]?.total ?? 100,
    }))
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const hasExisting = Object.keys(existing).length > 0;

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
          await saveMarks(rows.map((r) => ({ ...r, exam_id: examId, subject_id: subjectId })));
          setMessage(hasExisting ? "Marks updated." : "Marks saved.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not save");
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2.5 pr-2 font-semibold">Roll</th>
              <th className="py-2.5 pr-2 font-semibold">Student</th>
              <th className="py-2.5 pr-2 font-semibold">Obtained</th>
              <th className="py-2.5 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student, index) => (
              <tr key={student.id} className="hover:bg-slate-50/80">
                <td className="py-2 pr-2 tabular-nums text-slate-600">{student.roll_no ?? "—"}</td>
                <td className="py-2 pr-2">
                  <span className="font-bold text-brand-navy">{student.name}</span>
                  {student.admission_no && (
                    <span className="ml-2 text-[11px] text-slate-400">{student.admission_no}</span>
                  )}
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={rows[index]?.obtained ?? 0}
                    onChange={(e) =>
                      setRows((c) =>
                        c.map((r, i) => (i === index ? { ...r, obtained: Number(e.target.value) } : r))
                      )
                    }
                    className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5"
                  />
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    min={1}
                    step="0.5"
                    value={rows[index]?.total ?? 100}
                    onChange={(e) =>
                      setRows((c) =>
                        c.map((r, i) => (i === index ? { ...r, total: Number(e.target.value) } : r))
                      )
                    }
                    className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5"
                  />
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
        {pending ? "Saving…" : hasExisting ? "Update marks" : "Save marks"}
      </button>
      {message && <p className="text-xs font-bold text-emerald-700">{message}</p>}
      {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
    </form>
  );
}
