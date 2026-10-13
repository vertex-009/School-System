"use client";
export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="mt-6 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white print:hidden">Print</button>;
}
