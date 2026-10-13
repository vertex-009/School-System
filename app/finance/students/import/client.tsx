"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { importStudentsForClass, type ImportRow } from "@/lib/actions";
import { Card } from "@/components/ui";

type Klass = { id: string; name: string };

type ClassResult = { added: number; skipped: string[] };

/** Same fields as Add Student form — class is chosen by tick, not in the file. */
export const IMPORT_COLUMNS = [
  { key: "name", label: "Name", required: true },
  { key: "father_name", label: "Father name", required: false },
  { key: "cnic", label: "CNIC", required: true, note: "13 digits e.g. 12345-1234567-1" },
  { key: "guardian_phone", label: "Guardian phone", required: false },
  { key: "gender", label: "Gender", required: false },
  { key: "dob", label: "Date of birth", required: false, note: "YYYY-MM-DD" },
  { key: "address", label: "Address", required: false },
  { key: "admission_no", label: "Admission number", required: true },
  { key: "roll_no", label: "Roll number", required: false },
  { key: "status", label: "Status", required: false, note: "active or left (default active)" },
] as const;

const SAMPLE_ROW = {
  name: "Ali Khan",
  father_name: "Ahmed Khan",
  cnic: "12345-1234567-1",
  guardian_phone: "03001234567",
  gender: "Male",
  dob: "2015-05-10",
  address: "Street 1, City",
  admission_no: "ADM-001",
  roll_no: 1,
  status: "active",
};

function downloadTemplate() {
  const headers = IMPORT_COLUMNS.map((c) => c.key);
  const sheet = XLSX.utils.json_to_sheet([SAMPLE_ROW], { header: [...headers] });
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Students");
  XLSX.writeFile(book, "student-import-template.xlsx");
}

export function ClassImportClient({ classes }: { classes: Klass[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, ClassResult>>({});

  const selected = useMemo(() => classes.filter((c) => checked[c.id]), [classes, checked]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) {
        setFiles((f) => ({ ...f, [id]: null }));
      }
      return next;
    });
  };

  const importClass = async (classId: string, className: string) => {
    const file = files[classId];
    if (!file) {
      setErrors((e) => ({ ...e, [classId]: "Choose an Excel file first" }));
      return;
    }
    setBusyId(classId);
    setErrors((e) => ({ ...e, [classId]: "" }));
    try {
      const book = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const sheet = book.Sheets[book.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "" });
      if (!rows.length) {
        setErrors((e) => ({ ...e, [classId]: "File has no student rows" }));
        return;
      }
      const result = await importStudentsForClass(classId, rows);
      setResults((r) => ({ ...r, [classId]: result }));
    } catch (err) {
      setErrors((e) => ({
        ...e,
        [classId]: err instanceof Error ? err.message : `Import failed for ${className}`,
      }));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="Excel format (same as Add Student)"
        subtitle="School should prepare one file per class using these column headers. Do not put class name in the file — tick the class below."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-slate-500">
                <th className="py-2 pr-2">Column header</th>
                <th className="py-2 pr-2">Required</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {IMPORT_COLUMNS.map((c) => (
                <tr key={c.key} className="border-b border-slate-100">
                  <td className="py-2 pr-2 font-mono text-xs font-bold text-brand-navy">{c.key}</td>
                  <td className="py-2 pr-2">{c.required ? "Yes" : "No"}</td>
                  <td className="py-2 text-slate-600">
                    {c.label}
                    {"note" in c && c.note ? ` — ${c.note}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-brand-navy hover:bg-slate-50"
        >
          Download sample Excel template
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Accepts <b>.xlsx / .xls / .csv</b>. First sheet only. Duplicate admission numbers are skipped.
        </p>
      </Card>

      <Card
        title="Classes"
        subtitle="Tick a class → browse that class file → Import. Repeat for each class."
      >
        {!classes.length ? (
          <p className="text-sm text-slate-500">No classes yet. Ask Principal to add classes first.</p>
        ) : (
          <ul className="space-y-3">
            {classes.map((c) => {
              const on = !!checked[c.id];
              const busy = busyId === c.id;
              const result = results[c.id];
              const err = errors[c.id];
              return (
                <li
                  key={c.id}
                  className={`rounded-2xl border px-4 py-3 transition ${
                    on ? "border-brand-sky bg-brand-soft/50" : "border-slate-200 bg-white"
                  }`}
                >
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(c.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-navy focus:ring-brand-sky"
                    />
                    <span className="text-sm font-bold text-brand-navy">Class {c.name}</span>
                  </label>

                  {on && (
                    <div className="mt-3 space-y-2 border-t border-slate-200/80 pt-3 pl-7">
                      <p className="text-xs text-slate-500">
                        Browse Excel for <b>Class {c.name}</b> only — all rows will be saved into this class.
                      </p>
                      <div className="flex flex-wrap items-end gap-3">
                        <label className="block text-xs font-bold text-slate-600">
                          Excel file
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            disabled={busy}
                            className="mt-1 block w-full max-w-sm text-sm"
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              setFiles((prev) => ({ ...prev, [c.id]: f }));
                              setResults((r) => {
                                const next = { ...r };
                                delete next[c.id];
                                return next;
                              });
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          disabled={busy || !files[c.id]}
                          onClick={() => importClass(c.id, c.name)}
                          className="rounded-xl bg-brand-navy px-4 py-2 text-sm font-bold text-white hover:bg-brand-accent disabled:opacity-50"
                        >
                          {busy ? "Importing…" : `Import into Class ${c.name}`}
                        </button>
                      </div>
                      {files[c.id] && (
                        <p className="text-xs text-slate-500">Selected: {files[c.id]!.name}</p>
                      )}
                      {err && <p className="text-sm font-bold text-rose-600">{err}</p>}
                      {result && (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-sm">
                          <p className="font-bold text-emerald-900">
                            Class {c.name}: added {result.added}
                            {result.skipped.length ? ` · skipped ${result.skipped.length}` : ""}
                          </p>
                          {!!result.skipped.length && (
                            <ul className="mt-1 max-h-32 overflow-auto text-xs text-slate-600">
                              {result.skipped.slice(0, 40).map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!!selected.length && (
          <p className="mt-4 text-xs text-slate-500">
            {selected.length} class(es) ticked — import each file separately for a clean class-wise roster.
          </p>
        )}
      </Card>
    </div>
  );
}
