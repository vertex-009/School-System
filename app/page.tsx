import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { homeFor, type Role } from "@/lib/session";

export default async function Home() {
  const jar = await cookies();
  const role = jar.get("sms_role")?.value as Role | undefined;
  if (role && ["principal", "teacher", "finance"].includes(role)) {
    redirect(homeFor(role));
  }
  redirect("/login");
}
