/** Pakistani CNIC: 13 digits (optional dashes 12345-1234567-1). */

export function normalizeCnic(raw: string): string {
  return String(raw || "").replace(/\D/g, "");
}

export function isValidCnic(raw: string): boolean {
  return /^\d{13}$/.test(normalizeCnic(raw));
}

export function formatCnic(raw: string): string {
  const d = normalizeCnic(raw);
  if (d.length !== 13) return d;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

export function requireCnic(raw: string): { ok: true; cnic: string } | { ok: false; error: string } {
  const cnic = normalizeCnic(raw);
  if (!cnic) return { ok: false, error: "CNIC is required" };
  if (!isValidCnic(cnic)) return { ok: false, error: "CNIC must be 13 digits (e.g. 12345-1234567-1)" };
  return { ok: true, cnic };
}
