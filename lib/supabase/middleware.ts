import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseUrl, getSupabaseKey } from "./config";

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
}

/** Read JWT expiry from Supabase auth cookie without network. */
function readExpiresAt(request: NextRequest): number | null {
  const chunks = request.cookies
    .getAll()
    .filter((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  if (!chunks.length) return null;
  let raw = chunks.map((c) => c.value).join("");
  try {
    if (raw.startsWith("base64-")) {
      raw = Buffer.from(raw.slice("base64-".length), "base64").toString("utf8");
    } else {
      try {
        raw = decodeURIComponent(raw);
      } catch {
        /* keep */
      }
      if (!raw.trim().startsWith("{")) {
        raw = Buffer.from(raw, "base64").toString("utf8");
      }
    }
    const parsed = JSON.parse(raw) as { expires_at?: number; access_token?: string };
    if (typeof parsed.expires_at === "number") return parsed.expires_at;
    if (parsed.access_token) {
      const mid = parsed.access_token.split(".")[1];
      if (!mid) return null;
      const payload = JSON.parse(Buffer.from(mid.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")) as {
        exp?: number;
      };
      return payload.exp ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

function redirectTo(request: NextRequest, pathname: string, base?: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const response = NextResponse.redirect(url);
  if (base) base.cookies.getAll().forEach((c) => response.cookies.set(c.name, c.value));
  return response;
}

function applyRoleGuards(request: NextRequest, response: NextResponse) {
  const path = request.nextUrl.pathname;
  const role = request.cookies.get("sms_role")?.value;
  const userActive = request.cookies.get("sms_user_active")?.value !== "0";
  const schoolActive = request.cookies.get("sms_school_active")?.value !== "0";

  const isRolePath =
    path.startsWith("/teacher") ||
    path.startsWith("/finance") ||
    path.startsWith("/principal");

  if (!role) {
    if (isRolePath) return redirectTo(request, "/login", response);
    return response;
  }

  const staffRoles = ["teacher", "finance", "principal"];
  const blocked = staffRoles.includes(role) && (!userActive || !schoolActive);
  if (blocked && path !== "/suspended") return redirectTo(request, "/suspended", response);
  if (!blocked && path === "/suspended") return redirectTo(request, "/", response);

  if (path.startsWith("/teacher") && role !== "teacher") {
    return redirectTo(request, `/${role}`, response);
  }
  if (path.startsWith("/finance") && role !== "finance") {
    return redirectTo(request, `/${role}`, response);
  }
  if (path.startsWith("/principal") && role !== "principal") {
    return redirectTo(request, `/${role}`, response);
  }
  // Do NOT block /login so user can always open login in a new tab or switch accounts
  return response;
}

/**
 * Fast middleware: cookie role checks always.
 * Supabase getUser (network) ONLY when access token is missing/near expiry.
 * This removes ~1–3s delay on every sidebar click.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/auth");

  if (!hasSupabaseAuthCookie(request)) {
    if (isPublic) return NextResponse.next({ request });
    return redirectTo(request, "/login");
  }

  const exp = readExpiresAt(request);
  const now = Math.floor(Date.now() / 1000);
  const needsRefresh = exp === null || exp - now < 120;

  // Happy path: token still valid → no Supabase round-trip.
  if (!needsRefresh) {
    return applyRoleGuards(request, NextResponse.next({ request }));
  }

  let supabaseResponse = NextResponse.next({ request });
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  // getUser() validates the JWT with Auth (avoids insecure getSession().user warning).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isPublic) return supabaseResponse;
    return redirectTo(request, "/login", supabaseResponse);
  }

  return applyRoleGuards(request, supabaseResponse);
}
