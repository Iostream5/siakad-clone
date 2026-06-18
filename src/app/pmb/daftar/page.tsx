import Link from "next/link";
import { ArrowLeft, CircleCheckBig, Files, GraduationCap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { PmbRegistrationForm } from "@/app/pmb/daftar/registration-form";
import { getStudyProgramList } from "@/lib/admin/study-programs";
import { getSystemSettings } from "@/lib/admin/phase1-admin";

const supportItems = [
  "Isi data diri dan kontak aktif",
  "Pilih program studi tujuan",
  "Lanjutkan proses verifikasi PMB",
];

export default async function PmbRegistrationPage() {
  const programOptions = await getStudyProgramList();

  const settingsResult = await getSystemSettings();
  let isPmbOpen = true; // fallback
  if (settingsResult.rows) {
    const setting = settingsResult.rows.find((s) => s.key === "pmb_registration_open");
    if (setting && setting.value && typeof setting.value === "object" && "value" in setting.value) {
       isPmbOpen = Boolean(setting.value.value);
    }
  }

  if (!isPmbOpen) {
    return (
      <main className="relative min-h-screen px-5 py-8 flex flex-col items-center justify-center bg-slate-50 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Pendaftaran PMB Ditutup</h1>
        <p className="mt-2 text-slate-600 max-w-md">Saat ini periode pendaftaran mahasiswa baru telah ditutup. Silakan kembali ke halaman utama untuk informasi lebih lanjut.</p>
        <Link href="/pmb" className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Beranda
        </Link>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.2),transparent_24%),linear-gradient(180deg,#f8fbf9_0%,#eef5f1_100%)]" />
      <div className="relative mx-auto max-w-7xl space-y-6">
        <Link href="/pmb" className="inline-flex items-center gap-2 text-[0.92rem] font-medium text-slate-600 transition hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke halaman PMB
        </Link>

        {(!programOptions || programOptions.length === 0) && (
          <Card className="border-red-200 bg-red-50 p-6 mb-6">
            <p className="text-sm font-medium text-red-800">Perhatian: Saat ini belum ada program studi yang tersedia. Silakan hubungi panitia PMB.</p>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <Card className="border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.7))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] text-white shadow-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
            <p className="mt-5 text-[0.88rem] uppercase tracking-[0.22em] text-[var(--primary-strong)]">Pendaftaran online</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950">Formulir PMB calon mahasiswa.</h1>
            <p className="mt-3 text-[0.92rem] leading-6 text-slate-600">
              Lengkapi data berikut untuk mendapatkan nomor pendaftaran dan masuk ke proses seleksi.
            </p>

            <div className="mt-6 space-y-3">
              {supportItems.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5">
                  <CircleCheckBig className="h-4 w-4 text-[var(--primary)]" />
                  <p className="text-[0.92rem] text-slate-700">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.25rem] border border-slate-200 bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-3">
                <Files className="h-4 w-4 text-emerald-200" />
                <p className="text-[0.92rem] font-medium">Setelah submit, nomor pendaftaran muncul langsung di halaman ini.</p>
              </div>
            </div>
          </Card>

          <Card className="border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-6 shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
            <div className="border-b border-slate-200 pb-5">
              <p className="text-[0.88rem] uppercase tracking-[0.22em] text-[var(--primary-strong)]">Form PMB</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Isi data pendaftaran</h2>
            </div>
            <div className="pt-5">
              <PmbRegistrationForm programOptions={programOptions} />
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
