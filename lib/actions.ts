"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clearSessionCookies, getContext, homeFor, writeSessionCookies, type Role } from "@/lib/session";

function fail(error: { message: string } | null) { if (error) throw new Error(error.message); }

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role, is_active, school_id, phone, photo_url")
    .eq("id", user!.id)
    .maybeSingle();
  if (!profile) {
    await supabase.auth.signOut();
    return { error: "No profile found for this login." };
  }
  if (!["principal", "teacher", "finance"].includes(profile.role)) {
    await supabase.auth.signOut();
    return { error: "Use Principal, Finance, or Teacher login for this school." };
  }
  let schoolActive = true;
  if (profile.school_id) {
    const { data: school } = await supabase.from("schools").select("is_active").eq("id", profile.school_id).maybeSingle();
    schoolActive = school?.is_active !== false;
  }
  await clearSessionCookies();
  await writeSessionCookies({
    id: profile.id,
    name: profile.name,
    role: profile.role,
    is_active: profile.is_active,
    school_id: profile.school_id,
    phone: profile.phone,
    photo_url: profile.photo_url,
    school_active: schoolActive,
  });
  // Server redirect after cookies are set — avoids client replace race / redirect loop
  // that left the dashboard skeleton spinning forever.
  redirect(homeFor(profile.role as Role));
}
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearSessionCookies();
  redirect("/login");
}
export async function requestReset(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const origin = String(formData.get("origin") || "");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/reset-password` });
  if (error) return { error: error.message };
  return { ok: true };
}
export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") || "");
  if (password.length < 8) return { error: "Password must be at least 8 characters" };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/");
}
export async function updateProfile(formData: FormData) {
  const { supabase, profile, schoolActive } = await getContext();
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (name.length < 3) return { error: "Name must be at least 3 characters" };

  let photoUrl = profile.photo_url ?? null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/")) return { error: "Photo must be an image file" };
    if (photo.size > 2 * 1024 * 1024) return { error: "Photo must be under 2 MB" };
    const ext = photo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${profile.id}/avatar.${ext === "jpeg" ? "jpg" : ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, photo, {
      upsert: true,
      contentType: photo.type,
      cacheControl: "3600",
    });
    if (upErr) {
      return {
        error:
          upErr.message.includes("Bucket not found") || upErr.message.toLowerCase().includes("not found")
            ? "Photo storage is not set up yet. Create a public “avatars” bucket in Supabase Storage."
            : upErr.message,
      };
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    photoUrl = `${pub.publicUrl}?v=${Date.now()}`;
  }

  fail(
    (await supabase.from("profiles").update({ name, phone: phone || null, photo_url: photoUrl }).eq("id", profile.id))
      .error
  );
  await writeSessionCookies({
    id: profile.id,
    name,
    role: profile.role,
    is_active: profile.is_active,
    school_id: profile.school_id,
    phone: phone || null,
    photo_url: photoUrl,
    school_active: schoolActive,
  });
  revalidatePath("/profile");
  return { ok: true };
}

/** Change password while logged in (all roles). */
export async function changeLoggedInPassword(_prev: unknown, formData: FormData) {
  try {
    await getContext();
    const password = String(formData.get("password") || "");
    const confirm = String(formData.get("confirm") || "");
    if (password.length < 8) return { error: "Password must be at least 8 characters" };
    if (password !== confirm) return { error: "Passwords do not match" };
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    revalidatePath("/profile");
    return { ok: true as const, message: "Password updated." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not update password" };
  }
}
async function principal() {
  const ctx = await getContext();
  if (ctx.readOnly || ctx.profile.role !== "principal" || !ctx.schoolId) throw new Error("Only the Principal can change this");
  return ctx;
}
async function finance() {
  const ctx = await getContext();
  if (ctx.profile.role !== "finance" || !ctx.schoolId) throw new Error("Only Finance can change this");
  return ctx;
}
export async function saveClass(formData: FormData) {
  const { DEFAULT_SECTION_NAME } = await import("@/lib/class-label");
  const { supabase, schoolId } = await principal();
  const name = String(formData.get("name") || "").trim();
  fail((await supabase.from("classes").insert({ school_id: schoolId, name, sort_order: 50 })).error);
  const { data } = await supabase.from("classes").select("id").eq("school_id", schoolId).eq("name", name).single();
  // One hidden section per class (no A/B in the product UI).
  if (data) await supabase.from("sections").insert({ school_id: schoolId, class_id: data.id, name: DEFAULT_SECTION_NAME });
  revalidatePath("/principal/classes");
}
export async function deleteClass(classId: string) {
  const { supabase } = await principal();
  const { error } = await supabase.from("classes").delete().eq("id", classId);
  if (error) throw new Error("This class still has students or sections in use");
  revalidatePath("/principal/classes");
}
export async function addSubject(formData: FormData) {
  const { supabase, schoolId } = await principal();
  fail((await supabase.from("subjects").insert({ school_id: schoolId, name: String(formData.get("name") || "").trim() })).error);
  revalidatePath("/principal/subjects");
}
export async function createTeacher(formData: FormData) {
  const { requireCnic } = await import("@/lib/cnic");
  const { requireJoinedOn } = await import("@/lib/period");
  const { supabase, schoolId } = await principal();
  const password = String(formData.get("password") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const cnicCheck = requireCnic(String(formData.get("cnic") || ""));
  if (!cnicCheck.ok) return { error: cnicCheck.error };
  const joinCheck = requireJoinedOn(formData.get("joined_on"));
  if (!joinCheck.ok) return { error: joinCheck.error };
  const { error } = await supabase.rpc("create_teacher", {
    p_name: name,
    p_email: email,
    p_password: password,
    p_phone: String(formData.get("phone") || ""),
    p_cnic: cnicCheck.cnic,
  });
  if (error) return { error: error.message };
  // Set join date (requires migration_joined_on.sql)
  const { data: row } = await supabase
    .from("profiles")
    .select("id")
    .eq("school_id", schoolId)
    .eq("role", "teacher")
    .eq("name", name)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (row?.id) {
    const { error: jErr } = await supabase
      .from("profiles")
      .update({ joined_on: joinCheck.joined_on, left_on: null })
      .eq("id", row.id);
    if (jErr && jErr.message.toLowerCase().includes("joined_on")) {
      return { error: "Run supabase/migration_joined_on.sql in Supabase, then try again." };
    }
  }
  revalidatePath("/principal/teachers");
  revalidatePath("/principal/teachers/new");
  revalidatePath("/finance/salaries");
  revalidatePath("/finance/salaries/pay");
  revalidatePath("/finance/salaries/status");
  return { ok: true, email, password, name };
}
export async function setTeacherActive(teacherId: string, active: boolean) {
  const { supabase } = await principal();
  fail((await supabase.rpc("set_teacher_active", { p_teacher_id: teacherId, p_active: active })).error);
  const today = new Date().toISOString().slice(0, 10);
  await supabase
    .from("profiles")
    .update(active ? { left_on: null, is_active: true } : { left_on: today, is_active: false })
    .eq("id", teacherId);
  revalidatePath("/principal/teachers");
  revalidatePath(`/principal/teachers/${teacherId}`);
  revalidatePath("/finance/salaries/pay");
  revalidatePath("/finance/salaries/status");
}
/** Principal adds Finance for their own school. */
export async function createSchoolStaff(formData: FormData) {
  const { requireCnic } = await import("@/lib/cnic");
  const { requireJoinedOn } = await import("@/lib/period");
  const { supabase, schoolId } = await principal();
  const role = String(formData.get("role") || "");
  if (role !== "finance") return { error: "Role must be finance" };
  const password = String(formData.get("password") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const cnicCheck = requireCnic(String(formData.get("cnic") || ""));
  if (!cnicCheck.ok) return { error: cnicCheck.error };
  const joinCheck = requireJoinedOn(formData.get("joined_on"));
  if (!joinCheck.ok) return { error: joinCheck.error };
  const { error } = await supabase.rpc("create_school_staff", {
    p_name: name,
    p_email: email,
    p_password: password,
    p_phone: String(formData.get("phone") || ""),
    p_role: role,
    p_cnic: cnicCheck.cnic,
  });
  if (error) return { error: error.message };
  const { data: row } = await supabase
    .from("profiles")
    .select("id")
    .eq("school_id", schoolId)
    .eq("role", "finance")
    .eq("name", name)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (row?.id) {
    const { error: jErr } = await supabase
      .from("profiles")
      .update({ joined_on: joinCheck.joined_on, left_on: null })
      .eq("id", row.id);
    if (jErr && jErr.message.toLowerCase().includes("joined_on")) {
      return { error: "Run supabase/migration_joined_on.sql in Supabase, then try again." };
    }
  }
  revalidatePath("/principal/staff");
  revalidatePath("/principal/staff/new");
  revalidatePath("/finance/salaries/pay");
  revalidatePath("/finance/salaries/status");
  return { ok: true, email, password, name, role };
}
export async function setStaffActive(staffId: string, active: boolean) {
  const { supabase } = await principal();
  fail((await supabase.rpc("set_staff_active", { p_staff_id: staffId, p_active: active })).error);
  const today = new Date().toISOString().slice(0, 10);
  await supabase
    .from("profiles")
    .update(active ? { left_on: null, is_active: true } : { left_on: today, is_active: false })
    .eq("id", staffId);
  revalidatePath("/principal/staff");
  revalidatePath(`/principal/staff/${staffId}`);
  revalidatePath("/finance/salaries/pay");
  revalidatePath("/finance/salaries/status");
}

/** Principal edits finance or teacher profile fields (not password). Requires migration_principal_ui.sql. */
export async function updateStaffProfile(formData: FormData) {
  const { requireCnic } = await import("@/lib/cnic");
  const { supabase, schoolId } = await principal();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!id) return { error: "Missing staff id" };
  if (name.length < 3) return { error: "Name must be at least 3 characters" };
  const cnicCheck = requireCnic(String(formData.get("cnic") || ""));
  if (!cnicCheck.ok) return { error: cnicCheck.error };

  const { data: row } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", id)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!row || (row.role !== "finance" && row.role !== "teacher")) return { error: "Staff not found" };

  const { error } = await supabase
    .from("profiles")
    .update({ name, phone: phone || null, cnic: cnicCheck.cnic })
    .eq("id", id)
    .eq("school_id", schoolId);
  if (error) return { error: error.message };

  revalidatePath("/principal/staff");
  revalidatePath(`/principal/staff/${id}`);
  revalidatePath("/principal/teachers");
  revalidatePath(`/principal/teachers/${id}`);
  return { ok: true };
}
export async function assignTeacher(formData: FormData) {
  const { supabase, schoolId } = await principal();
  fail(
    (
      await supabase.from("teacher_assignments").insert({
        school_id: schoolId,
        teacher_id: String(formData.get("teacher_id")),
        section_id: String(formData.get("section_id")),
        subject_id: String(formData.get("subject_id")),
      })
    ).error
  );
  revalidatePath("/principal/assign");
  revalidatePath("/principal/assign/history");
}
export async function removeAssignment(id: string) {
  const { supabase } = await principal();
  fail((await supabase.from("teacher_assignments").delete().eq("id", id)).error);
  revalidatePath("/principal/assign");
  revalidatePath("/principal/assign/history");
}
export async function saveStudent(formData: FormData) {
  const { requireCnic } = await import("@/lib/cnic");
  const { primarySectionIdByClass } = await import("@/lib/class-label");
  const { supabase, schoolId } = await finance();
  const id = String(formData.get("id") || "");
  const cnicCheck = requireCnic(String(formData.get("cnic") || ""));
  if (!cnicCheck.ok) throw new Error(cnicCheck.error);

  // Prefer class_id (UI); fall back to section_id for older forms.
  let sectionId = String(formData.get("section_id") || "").trim() || null;
  const classId = String(formData.get("class_id") || "").trim();
  if (classId) {
    const { data: secs } = await supabase.from("sections").select("id, class_id, name").eq("school_id", schoolId).eq("class_id", classId);
    sectionId = primarySectionIdByClass(secs || []).get(classId) || null;
    if (!sectionId) throw new Error("Selected class has no roster unit. Re-add the class.");
  }

  const payload = {
    school_id: schoolId, name: String(formData.get("name") || "").trim(),
    father_name: String(formData.get("father_name") || "").trim() || null,
    guardian_phone: String(formData.get("guardian_phone") || "").trim() || null,
    gender: String(formData.get("gender") || "").trim() || null,
    dob: String(formData.get("dob") || "") || null,
    address: String(formData.get("address") || "").trim() || null,
    admission_no: String(formData.get("admission_no") || "").trim(),
    roll_no: formData.get("roll_no") ? Number(formData.get("roll_no")) : null,
    section_id: sectionId,
    status: String(formData.get("status") || "active"),
    cnic: cnicCheck.cnic,
  };
  if (!payload.name || !payload.admission_no) throw new Error("Name and admission number are required");
  if (!payload.section_id) throw new Error("Class is required");
  const { data: saved, error } = id
    ? await supabase.from("students").update(payload).eq("id", id).select("id").maybeSingle()
    : await supabase.from("students").insert(payload).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  // Invoices only via Dashboard → Generate invoices (RPC skips status=left).

  revalidatePath("/finance/students");
  revalidatePath("/principal/students");
  revalidatePath("/finance");
  revalidatePath("/finance/collect");
  revalidatePath("/finance/fee-records");
  revalidatePath("/finance/fees/unpaid");
  revalidatePath("/finance/history");
  const studentId = saved?.id || id;
  if (studentId) {
    revalidatePath(`/finance/students/${studentId}`);
    revalidatePath(`/principal/students/${studentId}`);
    redirect(`/finance/students/${studentId}`);
  }
  redirect("/finance/students");
}
export async function setStudentStatus(id: string, status: "active" | "left") {
  const { supabase } = await finance();
  fail((await supabase.from("students").update({ status }).eq("id", id)).error);
  revalidatePath("/finance/students");
}

/** Move all active students from one class to another. Finance only. */
export async function transferClass(formData: FormData) {
  const { primarySectionIdByClass } = await import("@/lib/class-label");
  const { supabase, schoolId, profile } = await finance();
  const fromClassId = String(formData.get("from_class_id") || "").trim();
  const toClassId = String(formData.get("to_class_id") || "").trim();
  const reason = String(formData.get("reason") || "").trim();

  if (!fromClassId) return { error: "Select the current class" };
  if (!toClassId) return { error: "Select the destination class" };
  if (fromClassId === toClassId) return { error: "Choose a different destination class" };

  const [{ data: fromClass }, { data: toClass }, { data: allSecs }] = await Promise.all([
    supabase.from("classes").select("id, name").eq("id", fromClassId).eq("school_id", schoolId).maybeSingle(),
    supabase.from("classes").select("id, name").eq("id", toClassId).eq("school_id", schoolId).maybeSingle(),
    supabase.from("sections").select("id, class_id, name").eq("school_id", schoolId),
  ]);
  if (!fromClass || !toClass) return { error: "Class not found" };

  const primary = primarySectionIdByClass(allSecs || []);
  const fromSectionIds = (allSecs || []).filter((s) => s.class_id === fromClassId).map((s) => s.id);
  const toSectionId = primary.get(toClassId) || null;
  if (!fromSectionIds.length) return { error: "Source class has no roster unit" };
  if (!toSectionId) return { error: "Destination class has no roster unit. Ask Principal to re-add the class." };

  const { data: students } = await supabase
    .from("students")
    .select("id, section_id")
    .eq("school_id", schoolId)
    .eq("status", "active")
    .in("section_id", fromSectionIds);

  const list = students || [];
  if (!list.length) return { error: "No active students in this class to transfer" };

  const { error: upErr } = await supabase
    .from("students")
    .update({ section_id: toSectionId })
    .eq("school_id", schoolId)
    .eq("status", "active")
    .in("section_id", fromSectionIds);
  if (upErr) return { error: upErr.message };

  const logs = list.map((s) => ({
    school_id: schoolId,
    student_id: s.id,
    from_section_id: s.section_id || null,
    to_section_id: toSectionId,
    from_class_name: fromClass.name,
    to_class_name: toClass.name,
    transfer_kind: "class",
    reason: reason || null,
    transferred_by: profile.id,
  }));
  const { error: logErr } = await supabase.from("student_transfers").insert(logs);
  if (logErr) {
    const msg = logErr.message || "";
    if (/student_transfers|schema cache|does not exist|transfer_kind/i.test(msg)) {
      revalidatePath("/finance/students");
      revalidatePath("/finance/students/transfer");
      redirect(`/finance/students/transfer?class=${toClassId}&done=1&count=${list.length}&warn=history`);
    }
    return { error: msg };
  }

  revalidatePath("/finance/students");
  revalidatePath("/finance/students/transfer");
  revalidatePath("/principal/students");
  redirect(`/finance/students/transfer?class=${toClassId}&done=1&count=${list.length}`);
}

/** Transfer one student out to another school (marks left + logs destination). Finance only. */
export async function transferStudentToSchool(formData: FormData) {
  const { classNameOf } = await import("@/lib/class-label");
  const { supabase, schoolId, profile } = await finance();
  const studentId = String(formData.get("student_id") || "").trim();
  const toSchoolName = String(formData.get("to_school_name") || "").trim();
  const reason = String(formData.get("reason") || "").trim();

  if (!studentId) return { error: "Select a student" };
  if (toSchoolName.length < 2) return { error: "Enter the destination school name" };

  const { data: student } = await supabase
    .from("students")
    .select("id, name, section_id, status, sections(name, classes(name))")
    .eq("id", studentId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!student) return { error: "Student not found" };
  if (student.status !== "active") return { error: "Student is already left / transferred" };

  const fromClassName = classNameOf(student.sections);
  const { error: upErr } = await supabase
    .from("students")
    .update({ status: "left" })
    .eq("id", studentId)
    .eq("school_id", schoolId);
  if (upErr) return { error: upErr.message };

  const { error: logErr } = await supabase.from("student_transfers").insert({
    school_id: schoolId,
    student_id: studentId,
    from_section_id: student.section_id || null,
    to_section_id: null,
    from_class_name: fromClassName,
    to_class_name: null,
    transfer_kind: "external",
    to_school_name: toSchoolName,
    reason: reason || null,
    transferred_by: profile.id,
  });
  if (logErr) {
    const msg = logErr.message || "";
    if (/student_transfers|schema cache|does not exist|transfer_kind|to_school/i.test(msg)) {
      revalidatePath("/finance/students");
      revalidatePath(`/finance/students/${studentId}`);
      redirect(`/finance/students/${studentId}?school_done=1&warn=history`);
    }
    return { error: msg };
  }

  revalidatePath("/finance/students");
  revalidatePath("/finance/students/transfer");
  revalidatePath("/finance/students/school-transfer");
  revalidatePath(`/finance/students/${studentId}`);
  revalidatePath("/principal/students");
  redirect(`/finance/students/${studentId}?school_done=1`);
}
export type ImportRow = {
  name?: string;
  father_name?: string;
  guardian_phone?: string;
  gender?: string;
  dob?: string | Date;
  address?: string;
  admission_no?: string;
  roll_no?: string | number;
  class_name?: string;
  section_name?: string;
  cnic?: string;
  status?: string;
};

/** Normalize Excel header keys → ImportRow fields (matches Add Student form). */
function normalizeImportRow(raw: Record<string, unknown>): ImportRow {
  const map = new Map<string, unknown>();
  for (const [k, v] of Object.entries(raw || {})) {
    const key = String(k)
      .toLowerCase()
      .trim()
      .replace(/[\s/.-]+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    map.set(key, v);
  }
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = map.get(k);
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return undefined;
  };
  const dobRaw = get("dob", "date_of_birth", "dateofbirth");
  let dob: string | undefined;
  if (dobRaw instanceof Date) dob = dobRaw.toISOString().slice(0, 10);
  else if (dobRaw != null) dob = String(dobRaw).slice(0, 10);

  return {
    name: get("name", "student_name", "student") as string | undefined,
    father_name: get("father_name", "fathername", "father") as string | undefined,
    cnic: get("cnic") as string | undefined,
    guardian_phone: get("guardian_phone", "phone", "guardianphone", "mobile") as string | undefined,
    gender: get("gender") as string | undefined,
    dob,
    address: get("address") as string | undefined,
    admission_no: get("admission_no", "admission_number", "admission", "admissionno") as string | undefined,
    roll_no: get("roll_no", "roll_number", "roll", "rollno") as string | number | undefined,
    status: get("status") as string | undefined,
    class_name: get("class_name", "class") as string | undefined,
  };
}

async function insertImportRows(sectionId: string, rows: ImportRow[]) {
  const { requireCnic } = await import("@/lib/cnic");
  const { supabase, schoolId } = await finance();
  let added = 0;
  const skipped: string[] = [];

  for (const raw of rows) {
    const row = normalizeImportRow(raw as Record<string, unknown>);
    const admission = String(row.admission_no || "").trim();
    const name = String(row.name || "").trim();
    if (!name && !admission) continue;
    if (!name || !admission) {
      skipped.push(admission || name || "blank row — name & admission_no required");
      continue;
    }
    const cnicCheck = requireCnic(String(row.cnic || ""));
    if (!cnicCheck.ok) {
      skipped.push(`${admission} (${cnicCheck.error})`);
      continue;
    }
    const statusRaw = String(row.status || "active").trim().toLowerCase();
    const status = statusRaw === "left" ? "left" : "active";
    const { error } = await supabase.from("students").insert({
      school_id: schoolId,
      name,
      father_name: row.father_name ? String(row.father_name).trim() : null,
      guardian_phone: row.guardian_phone ? String(row.guardian_phone).trim() : null,
      gender: row.gender ? String(row.gender).trim() : null,
      dob: row.dob ? String(row.dob).slice(0, 10) : null,
      address: row.address ? String(row.address).trim() : null,
      admission_no: admission,
      roll_no: row.roll_no != null && String(row.roll_no).trim() !== "" ? Number(row.roll_no) : null,
      section_id: sectionId,
      status,
      cnic: cnicCheck.cnic,
    });
    if (error) skipped.push(`${admission} (${error.message})`);
    else added += 1;
  }

  // Invoices only via Dashboard → Generate invoices (RPC skips status=left).
  revalidatePath("/finance/students");
  revalidatePath("/finance/students/import");
  revalidatePath("/finance");
  revalidatePath("/finance/collect");
  revalidatePath("/finance/fee-records");
  revalidatePath("/principal/students");
  return { added, skipped };
}

/** Import one Excel into a ticked class (class chosen in UI, not from file). */
export async function importStudentsForClass(classId: string, rows: ImportRow[]) {
  const { primarySectionIdByClass } = await import("@/lib/class-label");
  const { supabase, schoolId } = await finance();
  const id = String(classId || "").trim();
  if (!id) return { added: 0, skipped: ["No class selected"] };
  if (!rows?.length) return { added: 0, skipped: ["File has no data rows"] };

  const { data: klass } = await supabase
    .from("classes")
    .select("id, name")
    .eq("id", id)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!klass) return { added: 0, skipped: ["Class not found"] };

  const { data: secs } = await supabase
    .from("sections")
    .select("id, class_id, name")
    .eq("school_id", schoolId)
    .eq("class_id", id);
  const sectionId = primarySectionIdByClass(secs || []).get(id) || null;
  if (!sectionId) {
    return { added: 0, skipped: [`${klass.name}: no roster unit — ask Principal to re-add the class`] };
  }

  return insertImportRows(sectionId, rows);
}

/** Legacy: Excel includes class_name column. Prefer importStudentsForClass. */
export async function importStudents(rows: ImportRow[]) {
  const { primarySectionIdByClass } = await import("@/lib/class-label");
  const { supabase, schoolId } = await finance();
  const { data: sections } = await supabase
    .from("sections")
    .select("id, name, class_id, classes(name)")
    .eq("school_id", schoolId);
  const primary = primarySectionIdByClass(sections || []);
  const classMap = new Map<string, string>();
  (sections || []).forEach((section) => {
    const nested = section.classes as { name?: string } | { name?: string }[] | null;
    const className = String(
      (Array.isArray(nested) ? nested[0]?.name : nested?.name) || ""
    ).toLowerCase();
    const sid = primary.get(section.class_id);
    if (className && sid) classMap.set(className, sid);
  });

  let added = 0;
  const skipped: string[] = [];
  const bySection = new Map<string, ImportRow[]>();

  for (const raw of rows || []) {
    const row = normalizeImportRow(raw as Record<string, unknown>);
    const sectionId = classMap.get(String(row.class_name || "").trim().toLowerCase()) || null;
    if (!sectionId) {
      const admission = String(row.admission_no || "").trim() || String(row.name || "").trim() || "row";
      skipped.push(`${admission} (class not found — use Import by class instead)`);
      continue;
    }
    const list = bySection.get(sectionId) || [];
    list.push(row);
    bySection.set(sectionId, list);
  }

  for (const [sectionId, list] of bySection) {
    const r = await insertImportRows(sectionId, list);
    added += r.added;
    skipped.push(...r.skipped);
  }
  return { added, skipped };
}
export async function addSchoolExpense(formData: FormData) {
  const { supabase, schoolId, profile } = await finance();
  const kind = String(formData.get("kind") || "school");
  if (kind !== "school" && kind !== "other") return { error: "Invalid expense type" };
  const title = String(formData.get("title") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const expenseDate = String(formData.get("expense_date") || "").slice(0, 10) || new Date().toISOString().slice(0, 10);
  if (!title) return { error: "Title is required" };
  if (!(amount > 0)) return { error: "Amount must be positive" };

  const payload = {
    school_id: schoolId,
    kind,
    title,
    category: kind === "school" ? String(formData.get("category") || "").trim() || null : null,
    purpose: kind === "other" ? String(formData.get("purpose") || "").trim() || null : null,
    amount,
    expense_date: expenseDate,
    note: String(formData.get("note") || "").trim() || null,
    created_by: profile.id,
  };
  if (kind === "other" && !payload.purpose) return { error: "Purpose is required" };

  const { error } = await supabase.from("school_expenses").insert(payload);
  if (error) {
    if (/school_expenses|schema cache|does not exist/i.test(error.message)) {
      return { error: "Run supabase/migration_expenses_and_paid_unpaid.sql in Supabase first." };
    }
    return { error: error.message };
  }
  revalidatePath("/finance");
  revalidatePath("/finance/expenses");
  revalidatePath("/finance/expenses/other");
  revalidatePath("/finance/income-vs-expenses");
  revalidatePath("/principal");
  revalidatePath("/principal/fees/overview");
  return { ok: true };
}

export async function deleteSchoolExpense(id: string) {
  const { supabase, schoolId } = await finance();
  fail((await supabase.from("school_expenses").delete().eq("id", id).eq("school_id", schoolId)).error);
  revalidatePath("/finance");
  revalidatePath("/finance/expenses");
  revalidatePath("/finance/expenses/other");
  revalidatePath("/finance/income-vs-expenses");
  revalidatePath("/principal");
  revalidatePath("/principal/fees/overview");
}

export async function saveFee(classId: string, monthlyFee: number) {
  const { supabase, schoolId } = await finance();
  const { data: existing } = await supabase.from("fee_structure").select("id").eq("class_id", classId).maybeSingle();
  const { error } = existing
    ? await supabase.from("fee_structure").update({ monthly_fee: monthlyFee }).eq("id", existing.id)
    : await supabase.from("fee_structure").insert({ school_id: schoolId, class_id: classId, monthly_fee: monthlyFee });
  fail(error);
  // No auto invoice generation — Finance uses Dashboard → Generate invoices for this month.

  revalidatePath("/finance/fees");
  revalidatePath("/finance");
  revalidatePath("/finance/collect");
  revalidatePath("/finance/fee-records");
  revalidatePath("/finance/fees/unpaid");
  revalidatePath("/finance/history");
}
export async function generateInvoices(formData: FormData) {
  const { supabase } = await finance();
  const { parsePeriod } = await import("@/lib/period");
  const period = parsePeriod({ month: formData.get("month") as string, year: formData.get("year") as string });
  if (period.isFuture) {
    return { error: `Cannot generate invoices for a future month (${period.label}).` };
  }
  const { ensureCurrentMonthInvoices } = await import("@/lib/fee-invoices");
  const { data, error } = await ensureCurrentMonthInvoices(supabase, {
    month: period.month,
    year: period.year,
    dueDay: Number(formData.get("due_day") || 10),
  });
  if (error) return { error: error.message };
  revalidatePath("/finance/fees/records");
  revalidatePath("/finance/fees/invoices");
  revalidatePath("/finance");
  revalidatePath("/finance/collect");
  revalidatePath("/finance/fee-records");
  revalidatePath("/finance/fees/unpaid");
  revalidatePath("/finance/history");
  return { ok: true as const, created: (data as { created?: number })?.created ?? 0 };
}
export async function saveDiscount(formData: FormData) {
  const { supabase } = await finance();
  fail((await supabase.from("fee_invoices").update({ discount: Number(formData.get("discount") || 0), discount_reason: String(formData.get("reason") || "") }).eq("id", String(formData.get("invoice_id")))).error);
  revalidatePath("/finance/fees/records");
}
async function stampPaymentMeta(
  supabase: Awaited<ReturnType<typeof finance>>["supabase"],
  paymentId: string,
  receivedFrom: string,
  receivedBy: string
) {
  if (!paymentId || (!receivedFrom && !receivedBy)) return;
  await supabase
    .from("payments")
    .update({ received_from: receivedFrom || null, received_by: receivedBy || null })
    .eq("id", paymentId);
}

export async function collectFee(formData: FormData) {
  const { supabase, profile } = await finance();
  const receivedFrom = String(formData.get("received_from") || "").trim();
  const receivedBy = profile.name?.trim() || "Finance";
  const { data, error } = await supabase.rpc("collect_fee", {
    p_invoice_id: String(formData.get("invoice_id")),
    p_amount: Number(formData.get("amount")),
    p_method: String(formData.get("method") || "cash"),
  });
  if (error) return { error: error.message };

  const receiptNo = (data as { receipt_no?: string } | null)?.receipt_no || "";
  let paymentId = "";
  if (receiptNo) {
    const { data: pay } = await supabase
      .from("payments")
      .select("id")
      .eq("receipt_no", receiptNo)
      .maybeSingle();
    paymentId = pay?.id || "";
    await stampPaymentMeta(supabase, paymentId, receivedFrom, receivedBy);
  }

  revalidatePath("/finance/collect");
  revalidatePath("/finance/history");
  revalidatePath("/finance/fees/receipts");
  revalidatePath("/finance/fee-records");

  if (paymentId) {
    const qs = new URLSearchParams();
    if (receivedFrom) qs.set("from", receivedFrom);
    qs.set("by", receivedBy);
    redirect(`/finance/fees/receipts/${paymentId}?${qs.toString()}`);
  }
  return { ok: true, receipt: receiptNo };
}

/**
 * Apply cash oldest-first across unpaid invoices (arrears then current).
 * Form: student_id, amount, method, received_from, through_month, through_year
 */
export async function collectFeeWithArrears(formData: FormData) {
  const { supabase, schoolId, profile } = await finance();
  const studentId = String(formData.get("student_id") || "").trim();
  let remaining = Number(formData.get("amount") || 0);
  const method = String(formData.get("method") || "cash");
  const receivedFrom = String(formData.get("received_from") || "").trim();
  const receivedBy = profile.name?.trim() || "Finance";
  const throughMonth = Number(formData.get("through_month") || 0);
  const throughYear = Number(formData.get("through_year") || 0);

  if (!studentId) return { error: "Student required" };
  if (!(remaining > 0)) return { error: "Amount must be positive" };
  if (!throughMonth || !throughYear) return { error: "Fee month required" };

  const throughKey = throughYear * 12 + throughMonth;
  const { data: openInvoices, error: listErr } = await supabase
    .from("fee_invoices")
    .select("id, amount, discount, paid_amount, month, year, status")
    .eq("school_id", schoolId)
    .eq("student_id", studentId)
    .in("status", ["unpaid", "partial"])
    .order("year", { ascending: true })
    .order("month", { ascending: true });
  if (listErr) return { error: listErr.message };

  const queue = (openInvoices || [])
    .filter((inv) => inv.year * 12 + inv.month <= throughKey)
    .map((inv) => {
      const due = Number(inv.amount) - Number(inv.discount || 0) - Number(inv.paid_amount || 0);
      return { id: inv.id, due: Math.max(due, 0), month: inv.month, year: inv.year };
    })
    .filter((inv) => inv.due > 0);

  if (!queue.length) return { error: "No unpaid fees (including arrears) for this student" };

  const totalDue = queue.reduce((s, i) => s + i.due, 0);
  if (remaining > totalDue + 0.01) {
    return { error: `Amount exceeds total due ${totalDue.toLocaleString("en-PK")} (includes arrears)` };
  }

  let lastPaymentId = "";
  let lastReceipt = "";
  const applied: string[] = [];

  for (const inv of queue) {
    if (remaining <= 0) break;
    const payAmt = Math.min(remaining, inv.due);
    const { data, error } = await supabase.rpc("collect_fee", {
      p_invoice_id: inv.id,
      p_amount: payAmt,
      p_method: method,
    });
    if (error) return { error: error.message };
    const receiptNo = (data as { receipt_no?: string } | null)?.receipt_no || "";
    if (receiptNo) {
      const { data: pay } = await supabase.from("payments").select("id").eq("receipt_no", receiptNo).maybeSingle();
      if (pay?.id) {
        lastPaymentId = pay.id;
        lastReceipt = receiptNo;
        await stampPaymentMeta(supabase, pay.id, receivedFrom, receivedBy);
      }
      applied.push(`${inv.month}/${inv.year}`);
    }
    remaining = Math.round((remaining - payAmt) * 100) / 100;
  }

  revalidatePath("/finance/collect");
  revalidatePath("/finance/history");
  revalidatePath("/finance/fees/receipts");
  revalidatePath("/finance/fee-records");

  if (lastPaymentId) {
    const qs = new URLSearchParams();
    if (receivedFrom) qs.set("from", receivedFrom);
    qs.set("by", receivedBy);
    if (applied.length) qs.set("months", applied.join(","));
    redirect(`/finance/fees/receipts/${lastPaymentId}?${qs.toString()}`);
  }
  return { ok: true, receipt: lastReceipt };
}
export async function removePayment(id: string) {
  const { supabase } = await finance();
  fail((await supabase.rpc("delete_payment", { p_payment_id: id })).error);
  revalidatePath("/finance/fees/receipts");
}
export async function saveSalary(teacherId: string, monthlySalary: number) {
  const { supabase, schoolId } = await finance();
  const { data: existing } = await supabase.from("teacher_salaries").select("id").eq("teacher_id", teacherId).maybeSingle();
  const { error } = existing
    ? await supabase.from("teacher_salaries").update({ monthly_salary: monthlySalary }).eq("id", existing.id)
    : await supabase.from("teacher_salaries").insert({ school_id: schoolId, teacher_id: teacherId, monthly_salary: monthlySalary });
  fail(error);
  revalidatePath("/finance/salaries");
}
export async function paySalary(formData: FormData) {
  const { supabase, schoolId } = await finance();
  const { parsePeriod } = await import("@/lib/period");
  const period = parsePeriod({ month: formData.get("month") as string, year: formData.get("year") as string });
  if (period.isFuture) {
    return { error: `Cannot pay salary for a future month (${period.label}). Pick current or a past month.` };
  }
  const teacherId = String(formData.get("teacher_id") || "");
  if (!teacherId) return { error: "Select a staff member" };

  const { data: person } = await supabase
    .from("profiles")
    .select("joined_on, left_on, is_active")
    .eq("id", teacherId)
    .eq("school_id", schoolId)
    .maybeSingle();
  const { inEmploymentWindow } = await import("@/lib/period");
  if (!person || !inEmploymentWindow(person.joined_on, person.left_on, period)) {
    return { error: "No record found for this person in the selected month (before join or after leave)." };
  }

  const { data: existing } = await supabase
    .from("salary_payments")
    .select("id, receipt_no")
    .eq("school_id", schoolId)
    .eq("teacher_id", teacherId)
    .eq("month", period.month)
    .eq("year", period.year)
    .maybeSingle();
  if (existing) {
    return {
      error: `Already paid for ${period.label}${existing.receipt_no ? ` (${existing.receipt_no})` : ""}.`,
    };
  }

  const { data, error } = await supabase.rpc("pay_salary", {
    p_teacher_id: teacherId,
    p_amount: Number(formData.get("amount")),
    p_month: period.month,
    p_year: period.year,
    p_method: String(formData.get("method") || "cash"),
  });
  if (error) {
    const msg = error.message || "";
    if (msg.includes("salary_payments_teacher_id_month_year_key") || msg.toLowerCase().includes("duplicate")) {
      return { error: `Already paid for ${period.label}.` };
    }
    return { error: msg };
  }
  revalidatePath("/finance/salaries/pay");
  revalidatePath("/finance/salaries/status");
  return { ok: true, receipt: (data as { receipt_no?: string })?.receipt_no };
}

/** Salary-only staff (driver, peon, etc.) — no login. Finance or Principal may create; pay is Finance-only. */
export async function saveOtherEmployee(formData: FormData) {
  const ctx = await getContext();
  if (!ctx.schoolId || ctx.readOnly) return { error: "Not allowed" };
  if (!["finance", "principal"].includes(ctx.profile.role)) return { error: "Not allowed" };
  const { supabase, schoolId } = { supabase: ctx.supabase, schoolId: ctx.schoolId! };

  const { requireJoinedOn } = await import("@/lib/period");
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const jobTitle = String(formData.get("job_title") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const cnicRaw = String(formData.get("cnic") || "").trim();
  const monthlySalary = Number(formData.get("monthly_salary") || 0);

  if (name.length < 2) return { error: "Name is required" };
  if (!jobTitle) return { error: "Job title is required (e.g. Driver, Peon)" };
  if (monthlySalary < 0) return { error: "Salary cannot be negative" };

  let cnic: string | null = null;
  if (cnicRaw) {
    const { requireCnic } = await import("@/lib/cnic");
    const check = requireCnic(cnicRaw);
    if (!check.ok) return { error: check.error };
    cnic = check.cnic;
  }

  const joinCheck = requireJoinedOn(formData.get("joined_on"));
  // On edit, keep existing joined_on if field omitted
  let joined_on: string | undefined;
  if (!id) {
    if (!joinCheck.ok) return { error: joinCheck.error };
    joined_on = joinCheck.joined_on;
  } else if (joinCheck.ok) {
    joined_on = joinCheck.joined_on;
  }

  const payload: Record<string, unknown> = {
    school_id: schoolId,
    name,
    job_title: jobTitle,
    phone,
    cnic,
    monthly_salary: monthlySalary,
  };
  if (joined_on) payload.joined_on = joined_on;
  if (!id) payload.left_on = null;

  const { error } = id
    ? await supabase.from("other_employees").update(payload).eq("id", id).eq("school_id", schoolId)
    : await supabase.from("other_employees").insert(payload);

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("joined_on") || msg.includes("other_employees") || msg.includes("relation") || msg.includes("policy")) {
      return {
        error:
          "Run supabase/migration_other_employees.sql and migration_joined_on.sql in Supabase, then try again.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/finance/employees");
  revalidatePath("/finance/employees/pay");
  revalidatePath("/finance/employees/history");
  revalidatePath("/principal/employees");
  revalidatePath("/principal/employees/new");
  revalidatePath("/principal/fees/overview");
  return { ok: true };
}

export async function setOtherEmployeeActive(employeeId: string, active: boolean) {
  const ctx = await getContext();
  if (!ctx.schoolId || ctx.readOnly) throw new Error("Not allowed");
  if (!["finance", "principal"].includes(ctx.profile.role)) throw new Error("Not allowed");
  const today = new Date().toISOString().slice(0, 10);
  fail(
    (
      await ctx.supabase
        .from("other_employees")
        .update(active ? { is_active: true, left_on: null } : { is_active: false, left_on: today })
        .eq("id", employeeId)
        .eq("school_id", ctx.schoolId)
    ).error
  );
  revalidatePath("/finance/employees");
  revalidatePath("/finance/employees/pay");
  revalidatePath("/finance/employees/history");
  revalidatePath("/principal/employees");
  revalidatePath("/principal/fees/overview");
}

export async function payOtherEmployeeSalary(formData: FormData) {
  const { supabase, schoolId } = await finance();
  const { parsePeriod } = await import("@/lib/period");
  const period = parsePeriod({ month: formData.get("month") as string, year: formData.get("year") as string });
  if (period.isFuture) {
    return { error: `Cannot pay salary for a future month (${period.label}).` };
  }
  const employeeId = String(formData.get("employee_id") || "");
  if (!employeeId) return { error: "Select an employee" };

  const { data: emp } = await supabase
    .from("other_employees")
    .select("joined_on, left_on, is_active")
    .eq("id", employeeId)
    .eq("school_id", schoolId)
    .maybeSingle();
  const { inEmploymentWindow } = await import("@/lib/period");
  if (!emp || !inEmploymentWindow(emp.joined_on, emp.left_on, period)) {
    return { error: "No record found for this employee in the selected month (before join or after leave)." };
  }

  const { data: existing } = await supabase
    .from("other_salary_payments")
    .select("id, receipt_no")
    .eq("school_id", schoolId)
    .eq("employee_id", employeeId)
    .eq("month", period.month)
    .eq("year", period.year)
    .maybeSingle();
  if (existing) {
    return {
      error: `Already paid for ${period.label}${existing.receipt_no ? ` (${existing.receipt_no})` : ""}.`,
    };
  }

  const { data, error } = await supabase.rpc("pay_other_employee_salary", {
    p_employee_id: employeeId,
    p_amount: Number(formData.get("amount")),
    p_month: period.month,
    p_year: period.year,
    p_method: String(formData.get("method") || "cash"),
  });
  if (error) {
    const msg = error.message || "";
    if (msg.toLowerCase().includes("duplicate") || msg.includes("other_salary_payments")) {
      return { error: `Already paid for ${period.label}.` };
    }
    if (msg.toLowerCase().includes("function") || msg.toLowerCase().includes("relation")) {
      return { error: "Run supabase/migration_other_employees.sql in Supabase, then try again." };
    }
    return { error: msg };
  }
  revalidatePath("/finance/employees");
  revalidatePath("/finance/employees/pay");
  revalidatePath("/finance/employees/history");
  revalidatePath("/principal/employees");
  return { ok: true, receipt: (data as { receipt_no?: string })?.receipt_no };
}

export async function saveExam(formData: FormData) {
  const { supabase, schoolId } = await principal();
  fail((await supabase.from("exams").insert({ school_id: schoolId, class_id: String(formData.get("class_id")), name: String(formData.get("name") || "").trim(), kind: String(formData.get("kind")), exam_date: String(formData.get("exam_date") || "") || null })).error);
  revalidatePath("/principal/exams");
}
/**
 * Fee announcement only (no invoice generation — use Dashboard Generate).
 */
export async function openFeeCollection(formData: FormData) {
  const ctx = await getContext();
  const { supabase, schoolId, readOnly, profile } = ctx;
  if (readOnly || !schoolId) return { error: "Read only" };
  if (profile.role !== "finance") return { error: "Only Finance can open fee collection" };

  const audiences = formData.getAll("audience").map((v) => String(v).trim()).filter(Boolean);
  const { validateFeeOpenForm, validateFeeOpenPrereqs, isFeeMonthOpened } = await import("@/lib/fee-open");
  const form = validateFeeOpenForm({
    fee_month: formData.get("fee_month") as string,
    fee_year: formData.get("fee_year") as string,
    body: formData.get("body") as string,
    title: formData.get("title") as string,
    audiences,
    due_day: formData.get("due_day") as string,
  });
  if (!form.ok) return { error: form.error };

  const prereq = await validateFeeOpenPrereqs(supabase, schoolId, form.period);
  if (!prereq.ok) return { error: prereq.error };

  const already = await isFeeMonthOpened(supabase, schoolId, form.period.month, form.period.year);
  if (already.missingMigration) {
    return { error: "Run supabase/migration_fee_announcement.sql in Supabase, then try again." };
  }

  // Announcement only — invoices via Dashboard → Generate invoices (independent).
  const rows = form.audiences.map((audience) => ({
    school_id: schoolId,
    title: form.title,
    body: form.body,
    audience,
    target_teacher_id: null as string | null,
    created_by: profile.id,
    kind: "fee_open" as const,
    fee_month: form.period.month,
    fee_year: form.period.year,
  }));
  const { error } = await supabase.from("announcements").insert(rows);
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("kind") || msg.includes("fee_month") || msg.includes("column") || msg.includes("check")) {
      return { error: "Run supabase/migration_fee_announcement.sql in Supabase, then try again." };
    }
    return { error: error.message };
  }

  revalidatePath("/finance/announcements");
  revalidatePath("/principal/announcements");
  revalidatePath("/teacher/announcements");
  return {
    ok: true as const,
    kind: "fee_open" as const,
    feeLabel: form.period.label,
    refreshed: already.opened,
    month: form.period.month,
    year: form.period.year,
  };
}

export async function saveAnnouncement(formData: FormData) {
  const ctx = await getContext();
  const { supabase, schoolId, readOnly, profile } = ctx;
  if (readOnly || !schoolId) return { error: "Read only" };
  if (!["principal", "teacher", "finance"].includes(profile.role)) {
    return { error: "Not allowed" };
  }

  const id = String(formData.get("id") || "");
  let title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const targetTeacherId = String(formData.get("target_teacher_id") || "").trim() || null;
  const kindRaw = String(formData.get("kind") || "general").trim();
  const kind = kindRaw === "fee_open" ? "fee_open" : "general";

  // Multi-select: audience can be repeated checkboxes (audience=finance&audience=principal)
  let audiences = formData
    .getAll("audience")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (!audiences.length) {
    const single = String(formData.get("audience") || "").trim();
    if (single) audiences = [single];
  }
  // "Everyone" covers all — drop narrower targets if both selected
  if (audiences.includes("all")) audiences = ["all"];
  audiences = [...new Set(audiences)];

  if (!audiences.length) return { error: "Select at least one recipient" };

  /** Fee-open: announcement only (invoices via Dashboard Generate). */
  let feeMonth: number | null = null;
  let feeYear: number | null = null;
  let feeLabel: string | undefined;
  if (kind === "fee_open") {
    if (profile.role !== "finance") {
      return { error: "Only Finance can send fee collection announcements" };
    }
    if (id) {
      return { error: "Fee announcements cannot be edited — open again from Dashboard if needed" };
    }
    const { validateFeeOpenForm, validateFeeOpenPrereqs, isFeeMonthOpened } = await import("@/lib/fee-open");
    const form = validateFeeOpenForm({
      fee_month: formData.get("fee_month") as string,
      fee_year: formData.get("fee_year") as string,
      body,
      title,
      audiences,
      due_day: formData.get("due_day") as string,
    });
    if (!form.ok) return { error: form.error };
    const prereq = await validateFeeOpenPrereqs(supabase, schoolId, form.period);
    if (!prereq.ok) return { error: prereq.error };
    const mig = await isFeeMonthOpened(supabase, schoolId, form.period.month, form.period.year);
    if (mig.missingMigration) {
      return { error: "Run supabase/migration_fee_announcement.sql in Supabase, then try again." };
    }

    title = form.title;
    feeMonth = form.period.month;
    feeYear = form.period.year;
    feeLabel = form.period.label;
    audiences = form.audiences;
    // Announcement only — invoices via Dashboard Generate (independent).
    formData.set("body", form.body);
  } else {
    if (!title || !body) return { error: "Title and body are required" };
  }

  if (!title) return { error: "Title and body are required" };
  const finalBody = kind === "fee_open" ? String(formData.get("body") || "").trim() : body;
  if (!finalBody) return { error: "Body is required" };

  const allowedByRole: Record<string, string[]> = {
    principal: ["all", "finance", "teachers", "teacher"],
    teacher: ["principal", "finance"],
    finance: ["principal", "teachers"],
  };
  const allowed = allowedByRole[profile.role] || [];
  for (const audience of audiences) {
    if (!allowed.includes(audience)) return { error: "Invalid audience for your role" };
  }
  if (audiences.includes("teacher") && !targetTeacherId) {
    return { error: "Select a teacher for specific announcement" };
  }

  const feeMeta =
    kind === "fee_open"
      ? { kind, fee_month: feeMonth, fee_year: feeYear }
      : { kind: "general" as const, fee_month: null, fee_year: null };

  if (id) {
    // Edit keeps a single audience (first selected); kind stays general on edit
    const audience = audiences[0]!;
    const { error } = await supabase
      .from("announcements")
      .update({
        title,
        body: finalBody,
        audience,
        target_teacher_id: audience === "teacher" ? targetTeacherId : null,
      })
      .eq("id", id);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("audience") || msg.includes("created_by") || msg.includes("column") || msg.includes("check") || msg.includes("kind")) {
        return { error: "Run supabase/migration_staff_announcements.sql and migration_fee_announcement.sql in Supabase, then try again." };
      }
      return { error: error.message };
    }
  } else {
    const rows = audiences.map((audience) => ({
      school_id: schoolId,
      title,
      body: finalBody,
      audience,
      target_teacher_id: audience === "teacher" ? targetTeacherId : null,
      created_by: profile.id,
      ...feeMeta,
    }));
    const { error } = await supabase.from("announcements").insert(rows);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("audience") || msg.includes("created_by") || msg.includes("column") || msg.includes("check") || msg.includes("kind") || msg.includes("fee_month")) {
        return { error: "Run supabase/migration_fee_announcement.sql in Supabase, then try again." };
      }
      return { error: error.message };
    }
  }

  revalidatePath("/principal/announcements");
  revalidatePath("/principal/announcements/make");
  revalidatePath("/teacher/announcements");
  revalidatePath("/teacher/announcements/make");
  revalidatePath("/finance/announcements");
  revalidatePath("/finance/announcements/make");
  return { ok: true as const, kind, feeLabel };
}
export async function deleteAnnouncement(id: string) {
  const ctx = await getContext();
  if (!ctx.schoolId || ctx.readOnly) throw new Error("Not allowed");
  if (!["principal", "teacher", "finance"].includes(ctx.profile.role)) throw new Error("Not allowed");
  fail((await ctx.supabase.from("announcements").delete().eq("id", id).eq("school_id", ctx.schoolId)).error);
  revalidatePath("/principal/announcements");
  revalidatePath("/principal/announcements/make");
  revalidatePath("/teacher/announcements");
  revalidatePath("/finance/announcements");
}
export async function saveAttendance(rows: { student_id: string; section_id: string; date: string; status: string }[]) {
  const ctx = await getContext();
  if (!ctx.schoolId) throw new Error("No school selected");
  if (ctx.profile.role !== "teacher" && ctx.profile.role !== "principal") throw new Error("Not allowed");
  if (ctx.readOnly) throw new Error("Read only");
  fail((await ctx.supabase.from("attendance").upsert(rows.map((row) => ({ ...row, school_id: ctx.schoolId })), { onConflict: "student_id,date" })).error);
  revalidatePath("/teacher/attendance"); revalidatePath("/principal/attendance");
}
export async function saveMarks(rows: { exam_id: string; student_id: string; subject_id: string; obtained: number; total: number }[]) {
  const ctx = await getContext();
  if (ctx.profile.role !== "teacher" || !ctx.schoolId) throw new Error("Only a teacher can enter marks");
  fail((await ctx.supabase.from("marks").upsert(rows.map((row) => ({ ...row, school_id: ctx.schoolId })), { onConflict: "exam_id,student_id,subject_id" })).error);
  revalidatePath("/teacher/marks");
}

function timetableSettingsFromForm(formData: FormData) {
  return {
    day_start: String(formData.get("day_start") || "08:00"),
    day_end: String(formData.get("day_end") || "14:00"),
    period_minutes: Number(formData.get("period_minutes") || 40),
    break_after_period: Number(formData.get("break_after_period") || 0),
    break_minutes: Number(formData.get("break_minutes") || 15),
    working_days: Number(formData.get("working_days") || 6),
    periods_per_day: Number(formData.get("periods_per_day") || 7),
    num_rooms: Number(formData.get("num_rooms") || 8),
    max_teacher_periods_per_day: Number(formData.get("max_teacher_periods_per_day") || 6),
    periods_per_subject_week: Number(formData.get("periods_per_subject_week") || 4),
  };
}

export async function saveTimetableSettings(_prev: unknown, formData: FormData) {
  try {
    const { supabase, schoolId } = await principal();
    const s = timetableSettingsFromForm(formData);
    fail(
      (
        await supabase.from("timetable_settings").upsert(
          { school_id: schoolId, ...s, updated_at: new Date().toISOString() },
          { onConflict: "school_id" }
        )
      ).error
    );
    revalidatePath("/principal/timetable");
    return { ok: true as const, message: "Settings saved." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save settings" };
  }
}

export async function generateSchoolTimetable(_prev: unknown, formData: FormData) {
  const { generateTimetableV2 } = await import("@/lib/timetable/generate-v2");
  const { mergeDaySchedules, DEFAULT_DAY_SCHEDULES } = await import("@/lib/timetable/schedule");
  try {
    const { supabase, schoolId } = await principal();
    const s = timetableSettingsFromForm(formData);
    const classIds = formData.getAll("class_ids").map(String).filter(Boolean);
    const teacherCountAuto = String(formData.get("teacher_count_auto") || "1") !== "0";
    const requestedTeachers = Math.max(0, Math.min(80, Number(formData.get("teacher_count") || 0)));
    const mode = String(formData.get("teacher_slot_mode") || "subject_wise") === "mixed" ? "mixed" : "subject_wise";
    if (!classIds.length) return { error: "Select at least one class with subjects." };

    const subjectsByClass = new Map<string, string[]>();
    for (const classId of classIds) {
      const raw = String(formData.get(`class_subjects_${classId}`) || "[]");
      let names: string[] = [];
      try {
        names = JSON.parse(raw);
      } catch {
        names = raw.split(",").map((x) => x.trim()).filter(Boolean);
      }
      const cleaned = names.map((n) => String(n).trim()).filter((n) => n.length >= 1);
      if (cleaned.length) subjectsByClass.set(classId, cleaned);
    }
    if (!subjectsByClass.size) return { error: "Add subjects for each selected class (order matters for Friday)." };

    let day_schedules = DEFAULT_DAY_SCHEDULES;
    const rawSched = String(formData.get("day_schedules") || "");
    if (rawSched) {
      try {
        day_schedules = mergeDaySchedules(JSON.parse(rawSched));
      } catch {
        /* keep default */
      }
    } else {
      // Mirror legacy single start/end onto Mon–Thu+Sat; Friday shorter
      day_schedules = mergeDaySchedules({
        "1": { start: s.day_start, end: s.day_end, break_after: s.break_after_period, break_minutes: s.break_minutes },
        "2": { start: s.day_start, end: s.day_end, break_after: s.break_after_period, break_minutes: s.break_minutes },
        "3": { start: s.day_start, end: s.day_end, break_after: s.break_after_period, break_minutes: s.break_minutes },
        "4": { start: s.day_start, end: s.day_end, break_after: s.break_after_period, break_minutes: s.break_minutes },
        "5": { start: s.day_start, end: "11:00", break_after: 2, break_minutes: s.break_minutes },
        "6": { start: s.day_start, end: s.day_end, break_after: s.break_after_period, break_minutes: s.break_minutes },
      });
    }

    const { primarySectionIdByClass } = await import("@/lib/class-label");
    const { data: sections, error: sErr } = await supabase
      .from("sections")
      .select("id, class_id, name")
      .eq("school_id", schoolId)
      .in("class_id", Array.from(subjectsByClass.keys()));
    if (sErr) return { error: sErr.message };
    const primary = primarySectionIdByClass(sections || []);
    const primarySections = (sections || []).filter((sec) => primary.get(sec.class_id) === sec.id);
    if (!primarySections.length) return { error: "Selected classes are missing. Re-add classes first." };

    const { data: classRows } = await supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", schoolId)
      .in("id", Array.from(subjectsByClass.keys()));
    const className = Object.fromEntries((classRows || []).map((c) => [c.id, c.name]));

    const allNames = Array.from(new Set(Array.from(subjectsByClass.values()).flat()));
    for (const name of allNames) {
      const { data: existing } = await supabase
        .from("subjects")
        .select("id")
        .eq("school_id", schoolId)
        .ilike("name", name)
        .maybeSingle();
      if (!existing) {
        const ins = await supabase.from("subjects").insert({ school_id: schoolId, name });
        if (ins.error && !ins.error.message.toLowerCase().includes("duplicate")) {
          return { error: ins.error.message };
        }
      }
    }

    const { data: subjectRows } = await supabase.from("subjects").select("id, name").eq("school_id", schoolId);
    const nameToId = new Map<string, string>();
    for (const row of subjectRows || []) {
      nameToId.set(String(row.name).trim().toLowerCase(), row.id);
    }

    const plans = primarySections.map((sec) => ({
      section_id: sec.id,
      class_id: sec.class_id,
      class_name: className[sec.class_id] || sec.name,
      subjects: subjectsByClass.get(sec.class_id) || [],
    }));

    const result = generateTimetableV2({
      classes: plans,
      day_schedules,
      working_days: s.working_days || 6,
      num_rooms: s.num_rooms,
      teacher_slot_mode: mode,
      teacher_count: teacherCountAuto ? null : requestedTeachers,
      teacher_count_auto: teacherCountAuto,
      rotation_enabled: String(formData.get("rotation_enabled") || "1") !== "0",
    });

    if (!result.ok) {
      return {
        error: result.errors.map((e) => `${e.message}${e.fix ? ` — ${e.fix}` : ""}`).join(" "),
      };
    }

    const maxP = Math.max(...Object.values(result.periods_by_day), 1);
    const settingsPayload = {
      ...s,
      day_schedules,
      teacher_slot_mode: mode,
      teacher_count: result.min_teachers,
      teacher_count_auto: teacherCountAuto,
      periods_per_day: maxP,
      periods_per_subject_week: s.working_days,
      max_teacher_periods_per_day: maxP,
      status: "draft",
      rotation_enabled: String(formData.get("rotation_enabled") || "1") !== "0",
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const upsertSettings = await supabase
      .from("timetable_settings")
      .upsert({ school_id: schoolId, ...settingsPayload }, { onConflict: "school_id" });
    if (upsertSettings.error) {
      const msg = upsertSettings.error.message.toLowerCase();
      if (msg.includes("day_schedules") || msg.includes("status") || msg.includes("column")) {
        return { error: `${upsertSettings.error.message} — Run supabase/migration_timetable_v2.sql in Supabase.` };
      }
      return { error: upsertSettings.error.message };
    }

    // Replace draft slots only
    await supabase.from("timetable_slots").delete().eq("school_id", schoolId).eq("plan_status", "draft");
    // Also clear old rows without plan_status if any
    await supabase.from("timetable_slots").delete().eq("school_id", schoolId).is("plan_status", null);

    const lessonRows = result.slots
      .filter((slot) => !slot.is_free && slot.teacher_slot > 0)
      .map((slot) => {
        const subject_id = nameToId.get(slot.subject_name.toLowerCase());
        if (!subject_id) return null;
        return {
          school_id: schoolId,
          section_id: slot.section_id,
          subject_id,
          teacher_id: null as string | null,
          teacher_slot: slot.teacher_slot,
          day_of_week: slot.day_of_week,
          period_number: slot.period_number,
          room_number: slot.room_number,
          locked: false,
          is_free: false,
          plan_status: "draft" as const,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null);

    if (lessonRows.length) {
      const ins = await supabase.from("timetable_slots").insert(lessonRows);
      if (ins.error) {
        return { error: `${ins.error.message} — Run supabase/migration_timetable_v2.sql if columns are missing.` };
      }
    }

    await supabase.from("timetable_teacher_slots").delete().eq("school_id", schoolId);
    if (result.teacher_slots.length) {
      await supabase.from("timetable_teacher_slots").insert(
        result.teacher_slots.map((t) => ({
          school_id: schoolId,
          slot_no: t.slot_no,
          subject_id: t.subject_name ? nameToId.get(t.subject_name.toLowerCase()) || null : null,
          subject_name: t.subject_name,
          label: t.label,
        }))
      );
    }

    // Persist class subject order
    await supabase.from("timetable_class_subjects").delete().eq("school_id", schoolId);
    const classSubjectRows: {
      school_id: string;
      section_id: string;
      subject_id: string | null;
      subject_name: string;
      sort_order: number;
    }[] = [];
    for (const p of plans) {
      p.subjects.forEach((name, idx) => {
        classSubjectRows.push({
          school_id: schoolId,
          section_id: p.section_id,
          subject_id: nameToId.get(name.toLowerCase()) || null,
          subject_name: name,
          sort_order: idx,
        });
      });
    }
    if (classSubjectRows.length) {
      await supabase.from("timetable_class_subjects").insert(classSubjectRows);
    }

    revalidatePath("/principal/timetable");
    revalidatePath("/principal/timetable/view");
    revalidatePath("/principal/timetable/make");
    revalidatePath("/principal/timetable/assign-teachers");
    revalidatePath("/teacher/timetable");
    revalidatePath("/teacher");
    return {
      ok: true as const,
      placed: lessonRows.length,
      unplaced: 0,
      classes: plans.length,
      teachers: result.teacher_slots.length,
      message: `Draft ready — ${plans.length} class(es), ${result.teacher_slots.length} teacher slots, ${lessonRows.length} lessons. Next: Assign teachers, then Publish.`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generate failed";
    if (msg.includes("teacher_slot") || msg.includes("timetable") || msg.includes("column")) {
      return { error: `${msg} — Run supabase/migration_timetable_v2.sql in Supabase.` };
    }
    return { error: msg };
  }
}

export async function assignTimetableTeachers(_prev: unknown, formData: FormData) {
  try {
    const { supabase, schoolId } = await principal();
    const raw = String(formData.get("assignments") || "{}");
    let map: Record<string, string> = {};
    try {
      map = JSON.parse(raw);
    } catch {
      return { error: "Invalid assignments payload" };
    }

    const { data: slots } = await supabase
      .from("timetable_slots")
      .select("id, teacher_slot, section_id, subject_id, day_of_week, period_number")
      .eq("school_id", schoolId)
      .eq("plan_status", "draft");

    // Clash: one real teacher cannot cover two slots that share day+period
    const slotNosByTeacher = new Map<string, number[]>();
    for (const [slotNo, teacherId] of Object.entries(map)) {
      if (!teacherId) continue;
      const list = slotNosByTeacher.get(teacherId) || [];
      list.push(Number(slotNo));
      slotNosByTeacher.set(teacherId, list);
    }
    for (const [teacherId, slotNos] of slotNosByTeacher) {
      if (slotNos.length < 2) continue;
      const periods = new Set<string>();
      for (const sn of slotNos) {
        for (const row of slots || []) {
          if (row.teacher_slot !== sn) continue;
          const k = `${row.day_of_week}:${row.period_number}`;
          if (periods.has(k)) {
            return {
              error: `Teacher clash: same person assigned to T${slotNos.join(" & T")} that overlap on the timetable.`,
            };
          }
          periods.add(k);
        }
      }
      void teacherId;
    }

    // Update teacher_id on draft slots
    for (const [slotNo, teacherId] of Object.entries(map)) {
      const n = Number(slotNo);
      if (!n) continue;
      await supabase
        .from("timetable_slots")
        .update({ teacher_id: teacherId || null })
        .eq("school_id", schoolId)
        .eq("plan_status", "draft")
        .eq("teacher_slot", n);
    }

    // Upsert teacher_assignments from distinct (section, subject, teacher)
    const assigned = (slots || []).filter((s) => map[String(s.teacher_slot)]);
    const seen = new Set<string>();
    for (const row of assigned) {
      const teacher_id = map[String(row.teacher_slot)];
      if (!teacher_id || !row.subject_id) continue;
      const key = `${row.section_id}:${row.subject_id}:${teacher_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const { data: existing } = await supabase
        .from("teacher_assignments")
        .select("id")
        .eq("school_id", schoolId)
        .eq("section_id", row.section_id)
        .eq("subject_id", row.subject_id)
        .eq("teacher_id", teacher_id)
        .maybeSingle();
      if (!existing) {
        await supabase.from("teacher_assignments").insert({
          school_id: schoolId,
          section_id: row.section_id,
          subject_id: row.subject_id,
          teacher_id,
        });
      }
    }

    revalidatePath("/principal/timetable/assign-teachers");
    revalidatePath("/principal/timetable/view");
    revalidatePath("/teacher");
    return { ok: true as const, message: "Teacher assignments saved on draft timetable." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save assignments" };
  }
}

export async function publishTimetable(_formData?: FormData) {
  try {
    const { supabase, schoolId } = await principal();
    const { data: draft } = await supabase
      .from("timetable_slots")
      .select("id, teacher_id")
      .eq("school_id", schoolId)
      .eq("plan_status", "draft");
    if (!draft?.length) return { error: "No draft timetable to publish. Generate first." };

    const unassigned = draft.filter((d) => !d.teacher_id).length;
    // Replace published with draft
    await supabase.from("timetable_slots").delete().eq("school_id", schoolId).eq("plan_status", "published");
    await supabase
      .from("timetable_slots")
      .update({ plan_status: "published" })
      .eq("school_id", schoolId)
      .eq("plan_status", "draft");
    await supabase
      .from("timetable_settings")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("school_id", schoolId);

    revalidatePath("/principal/timetable");
    revalidatePath("/principal/timetable/view");
    revalidatePath("/teacher/timetable");
    revalidatePath("/teacher");
    return {
      ok: true as const,
      message:
        unassigned > 0
          ? `Published with warning: ${unassigned} lesson(s) still have no real teacher assigned.`
          : "Timetable published. Teachers can see My timetable now.",
      warning: unassigned > 0,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Publish failed" };
  }
}
