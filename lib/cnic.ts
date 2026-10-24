/** Pakistani CNIC: 13 digits (format: 12345-1234567-1). */

export function normalizeCnic(raw: string): string {
  return String(raw || "").replace(/\D/g, "");
}

export function isValidCnic(raw: string): boolean {
  return /^\d{13}$/.test(normalizeCnic(raw));
}

/** Formats a full or normalized 13-digit CNIC into standard XXXXX-XXXXXXX-X */
export function formatCnic(raw: string): string {
  const d = normalizeCnic(raw);
  if (d.length !== 13) return d;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

/** Live auto-formatting while typing: dynamically inserts dashes at digits 5 and 12, max 13 digits. */
export function formatCnicInput(raw: string): string {
  const digits = normalizeCnic(raw).slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function requireCnic(raw: string): { ok: true; cnic: string } | { ok: false; error: string; field: "cnic" } {
  const cnic = normalizeCnic(raw);
  if (!cnic) return { ok: false, error: "CNIC is required (13 digits)", field: "cnic" };
  if (!isValidCnic(cnic)) {
    return {
      ok: false,
      error: `CNIC must be exactly 13 digits (you entered ${cnic.length} digits). Format: 12345-1234567-1`,
      field: "cnic",
    };
  }
  return { ok: true, cnic };
}
