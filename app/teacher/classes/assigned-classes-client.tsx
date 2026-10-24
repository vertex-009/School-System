"use client";

import { useState } from "react";
import Link from "next/link";

export interface TeacherClassItem {
  sectionId: string;
  classId: string;
  label: string;
  subjects: string[];
  studentCount: number;
  students: {
    id: string;
    name: string;
    roll_no: string | null;
    admission_no: string | null;
    father_name: string | null;
  }[];
}

function SubjectIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes("math") || n.includes("hisab")) return <span>📐</span>;
  if (n.includes("sci") || n.includes("bio") || n.includes("chem") || n.includes("phy")) return <span>🔬</span>;
  if (n.includes("eng")) return <span>📖</span>;
  if (n.includes("urdu")) return <span>✍️</span>;
  if (n.includes("islam") || n.includes("quran")) return <span>🕌</span>;
  if (n.includes("comp") || n.includes("it")) return <span>💻</span>;
  if (n.includes("pak") || n.includes("geo") || n.includes("hist")) return <span>🌍</span>;
  if (n.includes("art") || n.includes("draw")) return <span>🎨</span>;
  return <span>📚</span>;
}

export function AssignedClassesClient({
  classes,
  initialSectionId,
}: {
  classes: TeacherClassItem[];
  initialSectionId?: string;
}) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    initialSectionId && classes.some((c) => c.sectionId === initialSectionId)
      ? initialSectionId
      : classes[0]?.sectionId || ""
  );

  const selectedClass = classes.find((c) => c.sectionId === selectedSectionId) || classes[0];

  return (
    <div className="space-y-5">
      {/* Top Header Banner */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#1a5276]/30 bg-gradient-to-r from-[#0b1f3a] via-[#102d54] to-[#1a5276] p-6 text-white shadow-[0_4px_20px_rgba(11,31,58,0.15)]">
        <div className="relative z-[1] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
              Academic Allocation
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Assigned Classes &amp; Subjects
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              Select any of your assigned classes below to view subjects and students.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-center backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-200">Total Classes</p>
              <p className="text-2xl font-black text-white tabular-nums">{classes.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-center backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-200">Total Subjects</p>
              <p className="text-2xl font-black text-white tabular-nums">
                {classes.reduce((acc, c) => acc + c.subjects.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {!classes.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
            📚
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">No classes assigned yet</h3>
          <p className="mt-1 text-xs text-slate-400">
            When the Principal assigns classes to you, they will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Assigned Classes List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Assigned Classes ({classes.length})
              </h2>
              <span className="text-[11px] text-slate-400">Click class to view subjects</span>
            </div>

            <div className="space-y-2.5">
              {classes.map((item) => {
                const isSelected = item.sectionId === selectedSectionId;
                return (
                  <button
                    key={item.sectionId}
                    type="button"
                    onClick={() => setSelectedSectionId(item.sectionId)}
                    className={`w-full text-left rounded-2xl p-4 transition-all duration-200 border cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-[#0b1f3a] to-[#163a66] text-white border-[#0b1f3a] shadow-md -translate-y-0.5"
                        : "bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800 hover:border-sky-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-sm ${
                            isSelected ? "bg-white/15 text-white" : "bg-sky-50 text-sky-800"
                          }`}
                        >
                          🏛️
                        </span>
                        <div>
                          <p className="font-bold text-base leading-tight">{item.label}</p>
                          <p
                            className={`text-xs mt-0.5 ${
                              isSelected ? "text-sky-200" : "text-slate-500"
                            }`}
                          >
                            {item.subjects.length} Subject{item.subjects.length !== 1 ? "s" : ""} · {item.studentCount} Student{item.studentCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span className="rounded-full bg-sky-400 px-2 py-0.5 text-[10px] font-black uppercase text-[#0b1f3a]">
                            Active
                          </span>
                        )}
                        <svg
                          className={`h-4 w-4 transition-transform ${
                            isSelected ? "text-white translate-x-1" : "text-slate-300"
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    {/* Small badges for subjects */}
                    <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100/20">
                      {item.subjects.map((s, idx) => (
                        <span
                          key={idx}
                          className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                            isSelected
                              ? "bg-white/15 text-sky-100"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Class's Subjects & Students (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {selectedClass ? (
              <>
                {/* 1. Subjects Card */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📚</span>
                        <h2 className="text-base font-bold text-[#0b1f3a]">
                          Subjects for {selectedClass.label}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Subjects assigned to you for teaching in {selectedClass.label}
                      </p>
                    </div>

                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800 border border-sky-200">
                      {selectedClass.subjects.length} Assigned
                    </span>
                  </div>

                  {!selectedClass.subjects.length ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No subjects specified for this class yet.
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedClass.subjects.map((subName, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50/80 to-white p-3.5 shadow-2xs transition hover:border-sky-200 hover:shadow-xs"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/80 text-xl shadow-2xs">
                            <SubjectIcon name={subName} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-[#0b1f3a] truncate">{subName}</p>
                            <p className="text-[11px] text-slate-500">Instructor: Assigned Faculty</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Students in Class Card */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">👥</span>
                        <h2 className="text-base font-bold text-[#0b1f3a]">
                          Student Roster · {selectedClass.label}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedClass.studentCount} enrolled student{selectedClass.studentCount !== 1 ? "s" : ""} in this class
                      </p>
                    </div>

                    <Link
                      href={`/teacher/students?section_id=${selectedClass.sectionId}`}
                      className="rounded-xl bg-[#0b1f3a] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-brand-accent shadow-xs"
                    >
                      Open Full Directory →
                    </Link>
                  </div>

                  {!selectedClass.students.length ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No students enrolled in {selectedClass.label} yet.
                    </div>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="pb-2.5 pr-3">Roll No.</th>
                            <th className="pb-2.5 pr-3">Student Name</th>
                            <th className="pb-2.5 pr-3">Father Name</th>
                            <th className="pb-2.5 text-right">Admission #</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedClass.students.slice(0, 10).map((st) => (
                            <tr key={st.id} className="hover:bg-slate-50/60 transition">
                              <td className="py-2.5 pr-3 font-mono text-xs font-bold text-[#0b1f3a]">
                                {st.roll_no || "—"}
                              </td>
                              <td className="py-2.5 pr-3 font-bold text-slate-800">
                                {st.name}
                              </td>
                              <td className="py-2.5 pr-3 text-xs text-slate-500">
                                {st.father_name || "—"}
                              </td>
                              <td className="py-2.5 text-right font-mono text-xs text-slate-400">
                                {st.admission_no || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {selectedClass.students.length > 10 && (
                        <div className="mt-3 pt-2 text-center border-t border-slate-100">
                          <Link
                            href={`/teacher/students?section_id=${selectedClass.sectionId}`}
                            className="text-xs font-bold text-brand-navy hover:underline"
                          >
                            + View all {selectedClass.studentCount} students in {selectedClass.label} →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
