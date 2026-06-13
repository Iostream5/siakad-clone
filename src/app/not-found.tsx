import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-6">
        <SearchX className="h-10 w-10" />
      </div>
      <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-semibold text-slate-700 mb-4">Halaman Tidak Ditemukan</h2>
      <p className="text-slate-500 max-w-md mb-8">
        Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
        >
          Kembali ke Dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
