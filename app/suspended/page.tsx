import Image from "next/image";
import { signOut } from "@/lib/actions";
import { SCHOOL } from "@/lib/brand";

export default function SuspendedPage() {
  return (
    <main className="auth-bg flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-card">
        <Image src={SCHOOL.logoSrc} alt={SCHOOL.name} width={72} height={72} className="mx-auto h-16 w-16 object-contain" />
        <h1 className="mt-4 text-2xl font-bold text-brand-navy">Account suspended</h1>
        <p className="mt-2 text-sm text-slate-500">Your school or staff account is suspended. Please contact the Principal.</p>
        <form action={signOut} className="mt-6">
          <button className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white">Logout</button>
        </form>
      </div>
    </main>
  );
}
