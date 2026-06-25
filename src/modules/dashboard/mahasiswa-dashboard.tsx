"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  Lock,
  School,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { MahasiswaPostNimFlow, PostNimStepStatus } from "@/lib/admin/mahasiswa-post-nim-flow";
import type { SessionUser } from "@/types/domain";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusVariant(status: string) {
  if (status === "LUNAS" || status === "DISPENSASI" || status === "Disetujui") return "success";
  if (status === "Diajukan" || status === "MENUNGGU") return "secondary";
  if (status === "Ditolak") return "destructive";
  return "outline";
}

function stepIcon(status: PostNimStepStatus) {
  if (status === "done") return CheckCircle2;
  if (status === "blocked") return Lock;
  return Clock3;
}

function stepClass(status: PostNimStepStatus) {
  if (status === "done") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "current") return "border-cyan-200 bg-cyan-50 text-cyan-700";
  if (status === "blocked") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function fallbackFlow(user: SessionUser): MahasiswaPostNimFlow {
  return {
    mahasiswa: null,
    activeYear: null,
    ledger: null,
    registrasi: null,
    currentKrs: null,
    lmsClassesCount: 0,
    canSubmitKrs: false,
    krsLockedReason: "Data dashboard belum berhasil dimuat.",
    nextAction: {
      href: "/dashboard",
      label: "Muat ulang",
      title: `Halo, ${user.name}`,
      description: "Data tahap mahasiswa belum berhasil dimuat. Coba refresh halaman.",
    },
    steps: [],
    summary: {
      ipk: null,
      ips: null,
      outstanding: 0,
      activeBills: 0,
      overdueBills: 0,
      paidBills: 0,
      registrasiStatus: "BELUM",
      krsStatus: "BELUM ISI",
      totalSks: 0,
      lmsClasses: 0,
    },
  };
}

export function MahasiswaDashboard({
  user,
  flow,
}: {
  user: SessionUser;
  flow: MahasiswaPostNimFlow | null;
}) {
  const data = flow ?? fallbackFlow(user);
  const profile = data.mahasiswa;
  const summary = data.summary;

  const metrics = [
    {
      label: "IPK",
      value: summary.ipk == null ? "-" : summary.ipk.toFixed(2),
      caption: `IPS ${summary.ips == null ? "-" : summary.ips.toFixed(2)}`,
      icon: GraduationCap,
      accent: "text-violet-600",
    },
    {
      label: "Tagihan Aktif",
      value: formatCurrency(summary.outstanding),
      caption: `${summary.activeBills} belum selesai, ${summary.paidBills} lunas`,
      icon: Wallet,
      accent: summary.activeBills > 0 ? "text-rose-600" : "text-emerald-600",
    },
    {
      label: "Registrasi",
      value: summary.registrasiStatus,
      caption: data.activeYear?.nama ?? "Tahun akademik aktif belum diset",
      icon: ClipboardCheck,
      accent: "text-cyan-600",
    },
    {
      label: "KRS",
      value: summary.krsStatus,
      caption: `${summary.totalSks} SKS diajukan`,
      icon: BookOpenCheck,
      accent: "text-amber-600",
    },
    {
      label: "LMS",
      value: `${summary.lmsClasses} kelas`,
      caption: "Berdasarkan KRS disetujui",
      icon: School,
      accent: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Dashboard Mahasiswa</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                Halo, {profile?.users?.full_name ?? user.name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {profile?.nim ? `NIM ${profile.nim}` : "NIM belum terbaca"} - {profile?.program_studi?.nama ?? "Program studi belum terbaca"}
              </p>
            </div>
            <Badge variant={profile?.status_mahasiswa === "AKTIF" ? "success" : "secondary"} className="w-fit">
              {profile?.status_mahasiswa ?? "DATA BELUM SIAP"}
            </Badge>
          </div>

          <Card className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-cyan-600" />
                  <p className="text-sm font-bold uppercase text-cyan-700">Langkah berikutnya</p>
                </div>
                <h2 className="mt-2 text-xl font-bold text-slate-950">{data.nextAction.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{data.nextAction.description}</p>
              </div>
              <Link
                href={data.nextAction.href}
                className="inline-flex h-11 sm:h-10 items-center justify-center rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
              >
                {data.nextAction.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <p className="text-sm font-bold text-slate-950">Status KRS</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">Periode KRS</span>
              <Badge variant={data.activeYear?.is_krs_open ? "success" : "secondary"}>
                {data.activeYear?.is_krs_open ? "Dibuka" : "Tutup"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">Daftar ulang</span>
              <Badge variant={statusVariant(summary.registrasiStatus)}>{summary.registrasiStatus}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">KRS</span>
              <Badge variant={statusVariant(summary.krsStatus)}>{summary.krsStatus}</Badge>
            </div>
          </div>
          {!data.canSubmitKrs && data.krsLockedReason ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              {data.krsLockedReason}
            </p>
          ) : null}
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{metric.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{metric.caption}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Icon className={`h-5 w-5 ${metric.accent}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Tahapan Mahasiswa</h2>
            <p className="text-sm text-slate-500">Urutan setelah NIM sampai LMS.</p>
          </div>
          <Link href="/dashboard/keuangan?tab=tagihan" className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">
            Lihat tagihan
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.steps.length === 0 ? (
            <Card className="p-5">
              <p className="text-sm font-semibold text-slate-700">Data tahapan belum tersedia.</p>
            </Card>
          ) : data.steps.map((step) => {
            const Icon = stepIcon(step.status);
            return (
              <Link
                key={step.key}
                href={step.href}
                className={`block rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${stepClass(step.status)}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-bold">{step.label}</p>
                    <p className="mt-1 text-sm opacity-85">{step.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
