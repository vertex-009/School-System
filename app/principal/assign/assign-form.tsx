"use client";

import { useState, useTransition } from "react";
import { assignTeacher } from "@/lib/actions";

export interface TeacherItem {
  id: string;
  name: string;
  phone?: string;
  assignments: {
    id: string;
    className: string;
    subjectName: string;
  }[];
}

export interface ClassOption {
  id: string;
  name: string;
  sectionId: string;
}

export interface SubjectItem {
  id: string;
  name: string;
}

export function AssignTeacherForm({
  teachers,
  classes,
  subjects,
  initialTeacherId,
  readOnly,
}: {
  teachers: TeacherItem[];
  classes: ClassOption[];
  subjects: SubjectItem[];
  initialTeacherId?: string;
  readOnly?: boolean;
}) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(initialTeacherId || "");
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [customSubject, setCustomSubject] = useState<string>("");

  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const activeTeacher = teachers.find((t) => t.id === selectedTeacherId);

  const toggleSection = (secId: string) => {
    setSelectedSectionIds((prev) =>
      prev.includes(secId) ? prev.filter((id) => id !== secId) : [...prev, secId]
    );
  };

  const selectAllClasses = () => {
    setSelectedSectionIds(classes.map((c) => c.sectionId));
  };

  const clearClasses = () => {
    setSelectedSectionIds([]);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      setStatusMessage({ type: "error", text: "Please select a teacher." });
      return;
    }
    if (selectedSectionIds.length === 0) {
      setStatusMessage({ type: "error", text: "Please select at least one class." });
      return;
    }
    if (!customSubject.trim() && !selectedSubjectId) {
      setStatusMessage({ type: "error", text: "Please select or type a subject." });
      return;
    }

    const formData = new FormData();
    formData.append("teacher_id", selectedTeacherId);
    selectedSectionIds.forEach((secId) => {
      formData.append("section_ids", secId);
    });
    if (customSubject.trim()) {
      formData.append("custom_subject", customSubject.trim());
    } else {
      formData.append("subject_id", selectedSubjectId);
    }

    startTransition(async () => {
      setStatusMessage(null);
      const res = await assignTeacher(formData);
      if (res && !res.ok) {
        setStatusMessage({ type: "error", text: res.error || "Failed to assign teacher." });
      } else {
        setStatusMessage({
          type: "success",
          text: `Teacher successfully assigned to ${selectedSectionIds.length} class(es).`,
        });
        setSelectedSectionIds([]);
        setCustomSubject("");
      }
    });
  };

  if (readOnly) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        You are in read-only mode.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {statusMessage && (
          <div
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-bold transition shadow-xs ${
              statusMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{statusMessage.type === "success" ? "✓" : "⚠"}</span>
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          {/* Teacher Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Teacher <span className="text-rose-500">*</span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2 items-start">
              <select
                value={selectedTeacherId}
                onChange={(e) => {
                  setSelectedTeacherId(e.target.value);
                  setStatusMessage(null);
                }}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-brand-navy focus:bg-white focus:ring-1 focus:ring-brand-navy transition cursor-pointer"
              >
                <option value="">-- Choose Teacher --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.phone ? `(${t.phone})` : ""} · {t.assignments.length} assigned
                  </option>
                ))}
              </select>

              {activeTeacher && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Current Assignments ({activeTeacher.assignments.length})
                  </div>
                  {activeTeacher.assignments.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-400">None assigned yet</p>
                  ) : (
                    <div className="mt-1.5 flex flex-wrap gap-1.5 max-h-20 overflow-y-auto [scrollbar-width:thin]">
                      {activeTeacher.assignments.map((a) => (
                        <span
                          key={a.id}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                        >
                          <b className="text-brand-navy">{a.className}</b>: {a.subjectName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Classes Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Classes <span className="text-rose-500">*</span>
                </label>
                {selectedSectionIds.length > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                    {selectedSectionIds.length} Selected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllClasses}
                  className="font-bold text-brand-navy hover:underline cursor-pointer"
                >
                  Select All
                </button>
                {selectedSectionIds.length > 0 && (
                  <>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={clearClasses}
                      className="font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            {classes.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No classes registered in the school.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {classes.map((c) => {
                  const isSelected = selectedSectionIds.includes(c.sectionId);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleSection(c.sectionId)}
                      className={`flex items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? "border-[#0b1f3a] bg-[#0b1f3a] text-white shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span
                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded text-[9px] font-black ${
                          isSelected
                            ? "bg-white text-[#0b1f3a]"
                            : "border border-slate-300 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100" />

          {/* Subject Row: Dropdown and Custom Subject Input side-by-side */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Subject <span className="text-rose-500">*</span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <select
                  value={selectedSubjectId}
                  disabled={Boolean(customSubject.trim())}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setStatusMessage(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-brand-navy focus:bg-white focus:ring-1 focus:ring-brand-navy transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="">-- Select Subject from List --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Or type other subject name…"
                  value={customSubject}
                  onChange={(e) => {
                    setCustomSubject(e.target.value);
                    setStatusMessage(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy transition"
                />
                {customSubject && (
                  <button
                    type="button"
                    onClick={() => setCustomSubject("")}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isPending || !selectedTeacherId || selectedSectionIds.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0b1f3a] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-accent active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Assigning…</span>
                </>
              ) : (
                <span>Assign Teacher</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
