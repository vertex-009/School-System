"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, type ReactNode } from "react";
import { generateSchoolTimetable } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card, Field, Select } from "@/components/ui";
import type { TimetableSettingsRow } from "@/lib/timetable/defaults";

type ClassOption = { id: string; name: string; sectionCount: number };
type SubjectOption = { id: string; name: string };

export function MakeTimetableForm({
  readOnly,
  settings,
  classes,
  schoolSubjects,
  back,
}: {
  readOnly: boolean;
  settings: TimetableSettingsRow;
  classes: ClassOption[];
  schoolSubjects: SubjectOption[];
  back: ReactNode;
}) {
  const [genState, genAction, genPending] = useActionState(generateSchoolTimetable, null);
  const [teacherCount, setTeacherCount] = useState(12);
  const [teacherAuto, setTeacherAuto] = useState(true);
  const [mode, setMode] = useState<"subject_wise" | "mixed">("subject_wise");
  const [activeClassId, setActiveClassId] = useState(classes[0]?.id || "");
  const [subjectsByClass, setSubjectsByClass] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const c of classes) init[c.id] = schoolSubjects.map((s) => s.name);
    return init;
  });
  const [draft, setDraft] = useState("");

  const activeSubjects = subjectsByClass[activeClassId] || [];
  const classesReady = useMemo(
    () => classes.filter((c) => (subjectsByClass[c.id] || []).length > 0 && c.sectionCount > 0),
    [classes, subjectsByClass]
  );

  function setClassSubjects(classId: string, next: string[]) {
    setSubjectsByClass((prev) => ({ ...prev, [classId]: next }));
  }

  function moveSubject(idx: number, dir: -1 | 1) {
    const list = activeSubjects.slice();
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    [list[idx], list[j]] = [list[j], list[idx]];
    setClassSubjects(activeClassId, list);
  }

  function toggleSchoolSubject(name: string) {
    const list = activeSubjects.slice();
    const i = list.findIndex((x) => x.toLowerCase() === name.toLowerCase());
    if (i >= 0) list.splice(i, 1);
    else list.push(name);
    setClassSubjects(activeClassId, list);
  }

  function addTypedSubjects() {
    const parts = draft
      .split(/[,|\n]/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (!parts.length || !activeClassId) return;
    const list = activeSubjects.slice();
    for (const p of parts) {
      if (!list.some((x) => x.toLowerCase() === p.toLowerCase())) list.push(p);
    }
    setClassSubjects(activeClassId, list);
    setDraft("");
  }

  return (
    <Shell role="principal" title="Generate timetable">
      {back}

      {genState?.ok && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-bold">{genState.message}</p>
          <p className="mt-1">
            Placed: {genState.placed} · Teacher slots: {genState.teachers}
          </p>
          <Link
            href="/principal/timetable/assign-teachers"
            className="mt-2 inline-block font-bold text-brand-accent hover:underline"
          >
            Assign teachers →
          </Link>
        </div>
      )}
      {genState?.error && <p className="text-sm font-bold text-rose-600">{genState.error}</p>}

      {readOnly ? (
        <Card title="Generate">
          <p className="text-sm text-slate-500">You do not have permission.</p>
        </Card>
      ) : (
        <Card
          title="Generate draft"
          subtitle="Hard rules: every subject once Mon–Thu+Sat; Friday = first N subjects; teacher clash zero. Fails with a clear error if impossible."
        >
          <form
            action={genAction}
            onSubmit={(e) => {
              if (genState?.ok && !confirm("Replace the current draft timetable?")) e.preventDefault();
            }}
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
          >
            <Field label="School start" name="day_start" type="time" defaultValue={settings.day_start} required />
            <Field label="School end (Mon–Thu, Sat)" name="day_end" type="time" defaultValue={settings.day_end} required />
            <Field
              label="Break after period"
              name="break_after_period"
              type="number"
              min={0}
              max={12}
              defaultValue={settings.break_after_period}
              required
            />
            <Field
              label="Break minutes"
              name="break_minutes"
              type="number"
              min={0}
              max={60}
              defaultValue={settings.break_minutes}
              required
            />
            <Field label="Rooms" name="num_rooms" type="number" min={1} max={50} defaultValue={Math.max(settings.num_rooms, classes.length)} required />
            <Select label="Working days" name="working_days" defaultValue="6">
              <option value="6">6 (Mon–Sat)</option>
              <option value="5">5 (Mon–Fri)</option>
            </Select>
            <input type="hidden" name="period_minutes" value={settings.period_minutes} />
            <input type="hidden" name="periods_per_day" value={settings.periods_per_day} />
            <input type="hidden" name="periods_per_subject_week" value="6" />
            <input type="hidden" name="max_teacher_periods_per_day" value="12" />
            <input type="hidden" name="rotation_enabled" value="1" />

            <Select
              label="Teacher slot mode"
              name="teacher_slot_mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as "subject_wise" | "mixed")}
            >
              <option value="subject_wise">Subject-wise (default)</option>
              <option value="mixed">Mixed (fewer teachers)</option>
            </Select>

            <label className="flex items-end gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={teacherAuto}
                onChange={(e) => setTeacherAuto(e.target.checked)}
                className="h-4 w-4"
              />
              Auto teacher count
            </label>
            <input type="hidden" name="teacher_count_auto" value={teacherAuto ? "1" : "0"} />
            {!teacherAuto && (
              <Field
                label="Teacher slots"
                name="teacher_count"
                type="number"
                min={1}
                max={80}
                value={teacherCount}
                onChange={(e) => setTeacherCount(Number(e.target.value) || 1)}
                required
              />
            )}
            {teacherAuto && <input type="hidden" name="teacher_count" value={String(teacherCount)} />}

            <div className="md:col-span-2 lg:col-span-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-800">Classes & subjects</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Order matters: Friday uses the first N subjects. Use ↑↓ to reorder.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {classes.map((c) => {
                  const n = (subjectsByClass[c.id] || []).length;
                  const active = activeClassId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveClassId(c.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                        active ? "bg-brand-navy text-white" : "bg-white text-brand-navy border border-slate-200"
                      }`}
                    >
                      {c.name} ({n})
                    </button>
                  );
                })}
              </div>

              {activeClassId && (
                <div className="mt-4 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {schoolSubjects.map((s) => {
                      const on = activeSubjects.some((x) => x.toLowerCase() === s.name.toLowerCase());
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSchoolSubject(s.name)}
                          className={`rounded-md px-2 py-1 text-xs font-semibold ${
                            on ? "bg-emerald-100 text-emerald-900" : "bg-white border text-slate-600"
                          }`}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type subject names, comma-separated"
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={addTypedSubjects}
                      className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white"
                    >
                      Add
                    </button>
                  </div>
                  <ol className="space-y-1">
                    {activeSubjects.map((name, idx) => (
                      <li
                        key={`${name}-${idx}`}
                        className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-sm"
                      >
                        <span>
                          {idx + 1}. {name}
                        </span>
                        <span className="flex gap-1">
                          <button type="button" className="text-xs font-bold" onClick={() => moveSubject(idx, -1)}>
                            ↑
                          </button>
                          <button type="button" className="text-xs font-bold" onClick={() => moveSubject(idx, 1)}>
                            ↓
                          </button>
                          <button
                            type="button"
                            className="text-xs font-bold text-rose-600"
                            onClick={() =>
                              setClassSubjects(
                                activeClassId,
                                activeSubjects.filter((_, i) => i !== idx)
                              )
                            }
                          >
                            ✕
                          </button>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {classesReady.map((c) => (
                <input
                  key={c.id}
                  type="hidden"
                  name={`class_subjects_${c.id}`}
                  value={JSON.stringify(subjectsByClass[c.id] || [])}
                />
              ))}
              {classesReady.map((c) => (
                <input key={`cid-${c.id}`} type="hidden" name="class_ids" value={c.id} />
              ))}
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={genPending || !classesReady.length}
                className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent disabled:opacity-60"
              >
                {genPending ? "Generating…" : "Generate draft timetable"}
              </button>
            </div>
          </form>
        </Card>
      )}
    </Shell>
  );
}
