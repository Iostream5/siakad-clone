"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in real apps
    console.error("Global Error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-6">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-4">Terjadi Kesalahan</h1>
      <p className="text-slate-500 max-w-md mb-8">
        Maaf, sistem mengalami kendala teknis saat memproses permintaan Anda. Silakan coba lagi.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
        >
          Coba Lagi
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
