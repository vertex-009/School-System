import { signOut } from "@/lib/actions";

export function PageHeading({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
      <h1 className="text-lg font-bold tracking-tight text-brand-navy">{title}</h1>
      <form action={signOut} className="md:hidden">
        <button className="text-xs font-bold text-rose-600">Logout</button>
      </form>
    </header>
  );
}
