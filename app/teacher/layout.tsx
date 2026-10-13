import { AppChrome } from "@/components/app-chrome";
import { requireRoleCookie } from "@/lib/session";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requireRoleCookie("teacher");
  return <AppChrome role="teacher">{children}</AppChrome>;
}
