import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** App staff roles only — school stays; Super Admin / Accountant portals removed. */
export type Role = "principal" | "teacher" | "finance";
export type AppProfile = {
  id: string;
  name: string;
  role: Role;
  school_id: string | null;
  is_active: boolean;
  phone: string | null;
  photo_url: string | null;
};

const COOKIE = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 7 };

export async function writeSessionCookies(profile: {
  id?: string;
  name?: string;
  role: string;
  is_active: boolean;
  school_id: string | null;
  phone?: string | null;
  photo_url?: string | null;
  school_active?: boolean;
}) {
  const jar = await cookies();
  jar.set("sms_role", profile.role, COOKIE);
  jar.set("sms_user_active", profile.is_active ? "1" : "0", COOKIE);
  jar.set("sms_school_active", profile.school_active === false ? "0" : "1", COOKIE);
  if (profile.id) {
    const payload: AppProfile = {
      id: profile.id,
      name: profile.name || "",
      role: profile.role as Role,
      school_id: profile.school_id,
      is_active: profile.is_active,
      phone: profile.phone ?? null,
      photo_url: profile.photo_url ?? null,
    };
    jar.set("sms_profile", JSON.stringify(payload), COOKIE);
  }
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.delete("sms_role");
  jar.delete("sms_user_active");
  jar.delete("sms_school_active");
  jar.delete("sms_profile");
  jar.delete("sms_open_school");
}

/**
 * Fast path: use sms_profile cookie — skip auth.getSession() network call.
 * Supabase client still attached for DB (JWT from cookies).
 */
export const getContext = cache(async () => {
  const jar = await cookies();
  const schoolActive = jar.get("sms_school_active")?.value !== "0";
  const cached = jar.get("sms_profile")?.value;
  const supabase = await createClient();

  if (cached) {
    try {
      const profile = JSON.parse(cached) as AppProfile;
      if (profile?.id && profile.role) {
        return {
          supabase,
          user: { id: profile.id },
          profile,
          schoolId: profile.school_id,
          readOnly: false,
          schoolActive,
        };
      }
    } catch {
      /* fall through */
    }
  }

  // Prefer getUser() — validates JWT with Auth server (getSession().user is not trusted).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role, school_id, is_active, phone, photo_url")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/login");

  return {
    supabase,
    user,
    profile: profile as AppProfile,
    schoolId: profile.school_id,
    readOnly: false,
    schoolActive,
  };
});

export function homeFor(role: Role, _openSchool?: string | null) {
  if (role === "principal") return "/principal";
  if (role === "finance") return "/finance";
  if (role === "teacher") return "/teacher";
  return "/login";
}

export async function requireRoleCookie(allowed: Role | Role[]) {
  const jar = await cookies();
  const role = jar.get("sms_role")?.value as Role | undefined;
  const list = Array.isArray(allowed) ? allowed : [allowed];
  if (!role || !list.includes(role)) redirect("/login");
  const userActive = jar.get("sms_user_active")?.value !== "0";
  const schoolActive = jar.get("sms_school_active")?.value !== "0";
  if (!userActive || !schoolActive) redirect("/suspended");
  return role;
}
