import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/lib/actions";
import { SideNav } from "@/components/side-nav";
import type { ShellRole } from "@/components/shell";
import { SCHOOL } from "@/lib/brand";
import { AnnouncementSync } from "@/components/announcement-sync";

export function AppChrome({ role, children }: { role: ShellRole; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--page-bg)] text-slate-900 print:min-h-0 print:bg-white">
      <AnnouncementSync role={role} />
      <aside className="fixed inset-y-0 left-0 z-20 hidden h-dvh w-[15.5rem] flex-col overflow-hidden bg-[#071528] text-white md:flex print:hidden">
        <div className="shrink-0 border-b border-white/10 px-3 py-3">
          <div className="flex items-center gap-2.5">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white/10">
              <Image src={SCHOOL.logoSrc} alt="" fill sizes="40px" className="object-cover object-center" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-snug">{SCHOOL.name}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5dade2]">
                {role === "finance" ? "Finance" : role === "teacher" ? "Teacher" : "Principal"}
              </p>
            </div>
          </div>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2 text-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <SideNav role={role} variant="side" />
        </nav>
        <div className="shrink-0 space-y-1.5 border-t border-white/10 p-2.5">
          <Link href="/profile" prefetch className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10">
            My profile
          </Link>
          <form action={signOut}>
            <button
              className={
                role === "finance" || role === "teacher"
                  ? "w-full rounded-xl bg-[#8b1e2d] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#a02638]"
                  : "w-full rounded-xl bg-gradient-to-r from-[#1a8cff] to-[#5dade2] px-3 py-2.5 text-sm font-bold text-white shadow-[0_0_12px_rgba(26,140,255,0.35)] hover:brightness-110"
              }
            >
              Logout
            </button>
          </form>
        </div>
      </aside>

      <main className="md:pl-[15.5rem] print:pl-0">
        <nav className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden print:hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
            <Image src={SCHOOL.logoSrc} alt="" fill sizes="28px" className="object-cover object-center" />
          </span>
          <SideNav role={role} variant="mobile" />
        </nav>
        {children}
      </main>
    </div>
  );
}
