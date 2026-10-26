import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import type { Role } from "@/lib/session";

const ROLES: Role[] = ["principal", "teacher", "finance"];

export default async function Home() {
  const jar = await cookies();
  const role = jar.get("sms_role")?.value as Role | undefined;
  const userActive = jar.get("sms_user_active")?.value !== "0";
  const schoolActive = jar.get("sms_school_active")?.value !== "0";

  if (role && ROLES.includes(role) && userActive && schoolActive) {
    redirect(`/${role}`);
  }

  return <LandingPage />;
}
