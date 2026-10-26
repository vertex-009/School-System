/**
 * Robust Supabase URL and Key sanitization.
 * Handles user copy-paste edge cases on Vercel:
 * - Pasting "NEXT_PUBLIC_SUPABASE_URL=https://..." into the value field
 * - Pasting quotes ("https://..." or 'https://...')
 * - Leading/trailing whitespace or newlines
 * - Missing protocol
 */

const FALLBACK_URL = "https://cfjfbxnldnjuzrqpaibw.supabase.co";
const FALLBACK_KEY = "sb_publishable_AF694i2Wo6xtJAAk0kEEVQ_E2x12QSY";

export function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return FALLBACK_URL;

  let u = raw.trim();

  // Strip wrapping quotes
  if ((u.startsWith('"') && u.endsWith('"')) || (u.startsWith("'") && u.endsWith("'"))) {
    u = u.slice(1, -1).trim();
  }

  // Handle if user pasted "NEXT_PUBLIC_SUPABASE_URL=https://..."
  if (u.includes("=")) {
    u = u.split("=").pop()?.trim() || u;
  }

  // Strip wrapping quotes again if after equals
  if ((u.startsWith('"') && u.endsWith('"')) || (u.startsWith("'") && u.endsWith("'"))) {
    u = u.slice(1, -1).trim();
  }

  // Ensure protocol
  if (!u.startsWith("http://") && !u.startsWith("https://")) {
    if (u.includes("supabase.co")) {
      u = `https://${u.replace(/^[/:]+/, "")}`;
    } else {
      return FALLBACK_URL;
    }
  }

  try {
    const parsed = new URL(u);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return u;
    }
    return FALLBACK_URL;
  } catch {
    return FALLBACK_URL;
  }
}

export function getSupabaseKey(): string {
  const raw =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!raw) return FALLBACK_KEY;

  let k = raw.trim();

  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1).trim();
  }

  if (k.includes("=")) {
    k = k.split("=").pop()?.trim() || k;
  }

  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1).trim();
  }

  return k.length > 20 ? k : FALLBACK_KEY;
}
