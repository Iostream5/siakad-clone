import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="login-animated-bg flex min-h-screen items-center justify-center px-4 py-8">
      <section className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[1fr_420px]">
        <aside className="hidden bg-slate-900 p-8 text-white md:flex md:flex-col md:justify-between">
          <div className="text-center">
            <h1 className="text-xl font-semibold leading-tight">SIAKAD STAI</h1>
            <p className="mt-1 text-sm text-slate-300">STAI Al-Ittihad Cianjur</p>
          </div>
          <div className="flex items-center justify-center py-8">
            <Image src="/logostai.png" alt="Logo STAI Al-Ittihad Cianjur" width={220} height={220} className="h-56 w-56 object-contain" />
          </div>
          <p className="text-center text-xs text-slate-400">Portal Akademik</p>
        </aside>

        <div className="p-5 sm:p-6">
          <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali
          </Link>

          <div className="mb-5 flex flex-col items-center justify-center gap-2 text-center md:hidden">
            <div className="h-9 w-9 rounded-lg border border-slate-200 bg-white p-1.5">
              <Image src="/logostai.png" alt="Logo STAI" width={28} height={28} className="object-contain" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight text-slate-900">Login SIAKAD</h2>
              <p className="text-xs text-slate-500">Masuk ke dashboard</p>
            </div>
          </div>

          <div className="mb-4 hidden md:block">
            <h2 className="text-base font-semibold text-slate-900">Login SIAKAD</h2>
          </div>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}
