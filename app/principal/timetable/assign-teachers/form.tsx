"use client";

import { useActionState, useState, type ReactNode } from "react";
import Link from "next/link";
import { assignTimetableTeachers } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";

type SlotRow = {
  slot_no: number;
  label: string;
  subject_name: string;
  classes: string[];
  periods: number;
  teacher_id: string | null;
};

export function AssignTeachersForm({
  readOnly,
  teachers,
  slots,
  back,
}: {
  readOnly: boolean;
  teachers: { id: string; name: string }[];
  slots: SlotRow[];
  back: ReactNode;
}) {
  const [map, setMap] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const s of slots) if (s.teacher_id) init[String(s.slot_no)] = s.teacher_id;
    return init;
  });
  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => {
    fd.set("assignments", JSON.stringify(map));
    return assignTimetableTeachers(_, fd);
  }, null);

  return (
    <Shell role="principal" title="Assign teachers to T slots">
      {back}
      {state?.ok && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          {state.message}{" "}
          <Link href="/principal/timetable" className="underline">
            Publish from hub →
          </Link>
        </div>
      )}
      {state?.error && <p className="text-sm font-bold text-rose-600">{state.error}</p>}

      {!slots.length ? (
        <Card title="No draft slots">
          <p className="text-sm text-slate-600">
            Generate a draft first.{" "}
            <Link href="/principal/timetable/make" className="font-bold text-brand-accent underline">
              Generate →
            </Link>
          </p>
        </Card>
      ) : (
        <Card title="Virtual teacher slots" subtitle="Unassigned slots are OK in draft; Publish will warn.">
          <form action={action} className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-slate-500">
                    <th className="py-2 pr-2">Slot</th>
                    <th className="py-2 pr-2">Subject</th>
                    <th className="py-2 pr-2">Classes</th>
                    <th className="py-2 pr-2">Periods/week</th>
                    <th className="py-2">Real teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((s) => (
                    <tr key={s.slot_no} className="border-b">
                      <td className="py-2 pr-2 font-bold text-brand-navy">{s.label}</td>
                      <td className="py-2 pr-2">{s.subject_name}</td>
                      <td className="py-2 pr-2 text-xs text-slate-600">{s.classes.join(", ") || "—"}</td>
                      <td className="py-2 pr-2">{s.periods}</td>
                      <td className="py-2">
                        <select
                          disabled={readOnly}
                          value={map[String(s.slot_no)] || ""}
                          onChange={(e) =>
                            setMap((prev) => ({ ...prev, [String(s.slot_no)]: e.target.value }))
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        >
                          <option value="">— Unassigned —</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!readOnly && (
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save assignments"}
              </button>
            )}
          </form>
        </Card>
      )}
    </Shell>
  );
}
