"use client";
import { useState } from "react";
import * as XLSX from "xlsx";
import { importStudents, type ImportRow } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";
export function ImportClient() {
  const [result, setResult] = useState<{ added: number; skipped: string[] } | null>(null);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const onFile = async (file: File) => {
    setBusy(true); setError("");
    try {
      const book = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const rows = XLSX.utils.sheet_to_json<ImportRow>(book.Sheets[book.SheetNames[0]], { defval: "" });
      setResult(await importStudents(rows));
    } catch (err) { setError(err instanceof Error ? err.message : "Import failed"); }
    finally { setBusy(false); }
  };
  return (
    <Shell role="principal" title="Import Students">
      <Card title="Excel import" subtitle="Columns: name, father_name, cnic, guardian_phone, gender, dob, address, admission_no, roll_no, class_name. CNIC required. Duplicate admission numbers are skipped.">
        <input type="file" accept=".xlsx,.xls,.csv" disabled={busy} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        {busy && <p className="mt-3 text-sm">Importing…</p>}
        {error && <p className="mt-3 text-sm font-bold text-rose-600">{error}</p>}
        {result && <div className="mt-4 text-sm"><p className="font-bold">Added {result.added}. Skipped {result.skipped.length}.</p><ul className="mt-2 max-h-48 overflow-auto text-xs text-slate-600">{result.skipped.slice(0,50).map((item) => <li key={item}>{item}</li>)}</ul></div>}
      </Card>
    </Shell>
  );
}
