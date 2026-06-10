import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock3, FileCheck2, GraduationCap, NotebookTabs } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  {
    title: "Isi formulir online",
    body: "Calon mahasiswa mengisi biodata, program studi, dan kontak aktif.",
    icon: NotebookTabs,
  },
  {
    title: "Verifikasi berkas",
    body: "Tim PMB memeriksa data dan kelengkapan dokumen pendaftaran.",
    icon: FileCheck2,
  },
  {
    title: "Lanjut seleksi",
    body: "Peserta menerima informasi tes, hasil seleksi, dan instruksi daftar ulang.",
    icon: BadgeCheck,
  },
];

const highlights = [
  { label: "Pendaftaran", value: "Online" },
  { label: "Konfirmasi", value: "Cepat" },
  { label: "Jalur masuk", value: "Terpusat" },
];

export default function PublicPmbPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.22),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(245,158,11,0.12),transparent_20%),linear-gradient(180deg,#f7faf8_0%,#eef4f1_100%)]" />
      <div className="relative mx-auto max-w-7xl space-y-6">
        <section className="grid items-stretch gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[1.6rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(255,255,255,0.62))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.1)] md:p-9">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[rgba(15,118,110,0.14)] bg-white/80 px-3.5 py-1.5 text-[0.88rem] font-medium text-slate-700">
              <GraduationCap className="h-3.5 w-3.5 text-[var(--primary)]" />
              PMB Online STAI
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-[1.06] text-slate-950 md:text-5xl">
              Pendaftaran mahasiswa baru yang cepat, jelas, dan langsung online.
            </h1>
            <p className="mt-4 max-w-2xl text-[0.95rem] leading-7 text-slate-600 md:text-base">
              Calon mahasiswa bisa mendaftar tanpa login ke sistem internal. Isi formulir, pilih program studi,
              lalu lanjut ke proses verifikasi PMB.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/pmb/daftar">
                <Button size="lg" className="rounded-xl">
                  Daftar sekarang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg" className="rounded-xl">
                  Login panitia / mahasiswa
                </Button>
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-[1.25rem] border border-white/80 bg-white/80 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.2)] md:p-8">
            <p className="text-[0.88rem] uppercase tracking-[0.22em] text-emerald-200/80">Periode PMB</p>
            <h2 className="mt-2 text-2xl font-semibold">Alur pendaftaran calon mahasiswa</h2>
            <div className="mt-6 space-y-3">
              {steps.map(({ title, body, icon: Icon }, index) => (
                <div key={title} className="rounded-[1.25rem] border border-white/10 bg-white/6 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Step {index + 1}</p>
                      <h3 className="mt-1.5 text-base font-semibold">{title}</h3>
                      <p className="mt-1.5 text-[0.92rem] leading-6 text-slate-300">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[1.25rem] border border-emerald-300/20 bg-emerald-400/8 p-4">
              <div className="flex items-center gap-3">
                <Clock3 className="h-4 w-4 text-emerald-200" />
                <p className="text-[0.92rem] text-emerald-100">Isi formulir sekali, panitia lanjutkan proses dari dashboard PMB.</p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
