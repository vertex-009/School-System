import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/lib/actions";
import { SideNav } from "@/components/side-nav";
import type { ShellRole } from "@/components/shell";
import { SCHOOL } from "@/lib/brand";

export function AppChrome({ role, children }: { role: ShellRole; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-slate-900 print:min-h-0 print:bg-white">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-brand-navy text-white md:flex print:hidden">
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
              <Image src={SCHOOL.logoSrc} alt="" fill sizes="40px" className="object-cover object-center" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight">{SCHOOL.name}</p>
              <p className="text-[10px] uppercase tracking-wide text-brand-sky">{role.replace("_", " ")}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
          <SideNav role={role} variant="side" />
        </nav>
        <div className="space-y-2 border-t border-white/10 p-3">
          <Link href="/profile" prefetch className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10">
            My profile
          </Link>
          <form action={signOut}>
            <button className="w-full rounded-lg bg-rose-500/15 px-3 py-2 text-sm font-bold text-rose-200 hover:bg-rose-500/25">
              Logout
            </button>
          </form>
        </div>
      </aside>

      <main className="md:pl-64 print:pl-0">
        <nav className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 md:hidden print:hidden">
          <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md">
            <Image src={SCHOOL.logoSrc} alt="" fill sizes="28px" className="object-cover object-center" />
          </span>
          <SideNav role={role} variant="mobile" />
        </nav>
        {children}
      </main>
    </div>
  );
}
