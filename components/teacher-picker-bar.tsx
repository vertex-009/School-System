"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { matchesWordPrefix } from "@/lib/search";

type Teacher = { id: string; name: string };

export function TeacherPickerBar({
  teachers,
  activeId,
  basePath,
  month,
  year,
}: {
  teachers: Teacher[];
  activeId: string;
  basePath: string;
  month: number;
  year: number;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return teachers;
    return teachers.filter((t) => matchesWordPrefix(t.name, q));
  }, [teachers, q]);

  const periodQ = `&month=${month}&year=${year}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[200px] flex-1">
          <span className="sr-only">Search teachers</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search teacher by name…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-sky focus:bg-white focus:ring-2 focus:ring-brand-sky/40"
          />
        </label>
        {activeId && (
          <Link
            href={`${basePath}?month=${month}&year=${year}`}
            className="text-xs font-bold text-brand-accent hover:underline"
          >
            Show all
          </Link>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {filtered.map((t) => {
          const active = t.id === activeId;
          return (
            <Link
              key={t.id}
              href={`${basePath}?teacher_id=${t.id}${periodQ}`}
              className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                active
                  ? "bg-brand-navy text-white shadow-sm"
                  : "border border-slate-200 bg-white text-brand-navy hover:border-brand-sky"
              }`}
            >
              {t.name}
            </Link>
          );
        })}
        {!filtered.length && <p className="text-sm text-slate-500">No teachers match “{q}”.</p>}
      </div>
    </div>
  );
}
