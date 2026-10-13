import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { homeFor, type Role } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const jar = await cookies();
  const role = jar.get("sms_role")?.value as Role | undefined;
  if (role && ["principal", "teacher", "finance"].includes(role)) {
    redirect(homeFor(role));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["principal", "teacher", "finance"].includes(profile.role)) redirect("/login");
  redirect(homeFor(profile.role as Role));
}
