"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard Error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center min-h-[50vh]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mb-4">
        <AlertTriangle className="h-8 w-8 text-rose-500" />
      </div>
      <h2 className="text-xl font-bold text-rose-900 mb-2">Gagal Memuat Halaman</h2>
      <p className="text-rose-700 max-w-md mb-6">
        Terjadi masalah saat mencoba menampilkan konten ini. Cobalah untuk memuat ulang halaman.
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-rose-700 shadow-sm ring-1 ring-inset ring-rose-200 hover:bg-rose-50 transition-all"
      >
        Muat Ulang
      </button>
    </div>
  );
}
