"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Mail,
  ShieldCheck,
  Upload,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { NotificationPreviewData } from "@/lib/admin/notifications";
import type { PmbPaymentPortalData } from "@/lib/admin/pmb";
import type { SessionUser } from "@/types/domain";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { dateStyle: "medium" });
}

function stepBadge(status: string | null) {
  if (status === "paid" || status === "Terverifikasi" || status === "LULUS") return "success";
  if (status === "pending" || status === "Menunggu" || status === "VERIFIKASI") return "secondary";
  if (status === "Ditolak" || status === "Gagal" || status === "DITOLAK") return "destructive";
  return "outline";
}

function getPmbStage(portal: PmbPaymentPortalData) {
  const registration = portal.registration;
  if (!registration) {
    return {
      title: "Lengkapi pendaftaran",
      description: "Akun belum terhubung ke data PMB. Pastikan memakai email yang sama dengan formulir pendaftaran.",
      href: "/pmb/daftar",
      label: "Daftar PMB",
    };
  }

  if (registration.status_seleksi === "LULUS") {
    return {
      title: "Lulus seleksi",
      description: "Tunggu panitia memproses daftar ulang dan NIM. Semua notifikasi penting akan muncul di sini.",
      href: "/dashboard",
      label: "Cek status",
    };
  }

  if (registration.status_pembayaran !== "paid") {
    return {
      title: "Bayar invoice PMB",
      description: "Selesaikan pembayaran agar proses verifikasi dan seleksi bisa dibuka.",
      href: "/dashboard/keuangan?tab=pmb",
      label: "Buka pembayaran",
    };
  }

  if (registration.status_seleksi === "VERIFIKASI") {
    return {
      title: "Menunggu seleksi",
      description: "Pembayaran sudah masuk. Selanjutnya panitia akan menjadwalkan seleksi atau wawancara.",
      href: "/dashboard",
      label: "Lihat tahapan",
    };
  }

  return {
    title: "Ikuti seleksi PMB",
    description: "Jadwal seleksi dan hasil akhir akan muncul setelah panitia mengisi penilaian.",
    href: "/dashboard",
    label: "Buka dashboard",
  };
}

export function CalonMahasiswaDashboard({
  user,
  portal,
  notifications,
}: {
  user: SessionUser;
  portal: PmbPaymentPortalData;
  notifications: NotificationPreviewData;
}) {
  const registration = portal.registration;
  const stage = getPmbStage(portal);
  const latestPayment = portal.payments[0] ?? null;
  const unreadPmbNotifications = notifications.items.filter((item) => item.href?.includes("/dashboard") || item.href?.includes("/pmb"));

  const steps = [
    {
      key: "isi-data",
      label: "Isi data",
      status: registration ? "done" : "current",
      description: registration ? "Data pendaftaran sudah tersimpan." : "Lengkapi formulir pendaftaran PMB.",
      href: "/pmb/daftar",
    },
    {
      key: "bayar-pmb",
      label: "Bayar PMB",
      status: registration?.status_pembayaran === "paid" ? "done" : registration ? "current" : "blocked",
      description: registration?.status_pembayaran === "paid" ? "Invoice sudah lunas." : "Selesaikan invoice PMB.",
      href: "/dashboard/keuangan?tab=pmb",
    },
    {
      key: "tunggu-verifikasi",
      label: "Tunggu verifikasi",
      status: registration?.status_pembayaran === "paid" ? "current" : "blocked",
      description: registration?.status_seleksi === "VERIFIKASI" ? "Panitia sedang memproses seleksi." : "Menunggu status pembayaran dibuka.",
      href: "/dashboard",
    },
    {
      key: "ikuti-seleksi",
      label: "Ikuti seleksi",
      status: registration?.status_seleksi === "VERIFIKASI" || registration?.status_seleksi === "LULUS" ? "current" : "blocked",
      description: registration?.status_seleksi === "LULUS" ? "Seleksi selesai." : "Jadwal seleksi akan muncul di notifikasi.",
      href: "/dashboard",
    },
    {
      key: "lihat-hasil",
      label: "Lihat hasil",
      status: registration?.status_seleksi === "LULUS" ? "done" : registration?.status_seleksi === "DITOLAK" ? "done" : "blocked",
      description: registration?.status_seleksi ?? "Belum ada hasil",
      href: "/dashboard",
    },
    {
      key: "lanjut-registrasi",
      label: "Lanjut registrasi/NIM",
      status: registration?.status_seleksi === "LULUS" ? "current" : "blocked",
      description: "Panitia akan memproses daftar ulang dan NIM.",
      href: "/dashboard",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-cyan-700">Portal Calon Mahasiswa</p>
              <h1 className="mt-2 text-2xl font-black text-slate-950">Halo, {registration?.nama_lengkap ?? user.name}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {registration?.nomor_pendaftaran ?? "Nomor pendaftaran belum tersedia"} - {registration?.program_studi?.nama ?? "Program studi belum terisi"}
              </p>
            </div>
            <Badge variant={stepBadge(registration?.status_seleksi ?? registration?.status_pembayaran ?? null)} className="h-fit">
              {registration?.status_seleksi ?? registration?.status_pembayaran ?? "BELUM DRAFT"}
            </Badge>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice PMB</p>
              <p className="mt-2 text-lg font-black text-slate-950">{registration?.invoice_number ?? "-"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status pembayaran</p>
              <p className="mt-2 text-lg font-black text-slate-950">{registration?.status_pembayaran ?? "-"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status seleksi</p>
              <p className="mt-2 text-lg font-black text-slate-950">{registration?.status_seleksi ?? "-"}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={stage.href} className="inline-flex h-11 sm:h-10 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-strong)]">
              {stage.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/dashboard/keuangan?tab=pmb" className="inline-flex h-11 sm:h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Bayar PMB
            </Link>
            <Link href="/dashboard/notifikasi" className="inline-flex h-11 sm:h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Notifikasi
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Langkah berikutnya</p>
              <h2 className="text-xl font-black text-slate-950">{stage.title}</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{stage.description}</p>
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <p className="text-sm font-semibold text-emerald-900">
                Semua data yang tampil hanya milik akun login ini.
              </p>
            </div>
          </div>
          {latestPayment ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pembayaran terakhir</p>
              <p className="mt-2 text-sm font-bold text-slate-950">{latestPayment.metode} - {formatCurrency(Number(latestPayment.nominal))}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDate(latestPayment.tanggal_bayar)} - {latestPayment.status}</p>
            </div>
          ) : null}
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Batas pembayaran</p>
          <p className="mt-2 text-lg font-black text-slate-950">{formatDate(registration?.invoice_due_at)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nominal invoice</p>
          <p className="mt-2 text-lg font-black text-slate-950">{formatCurrency(Number(registration?.invoice_amount ?? 0))}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notifikasi baru</p>
          <p className="mt-2 text-lg font-black text-slate-950">{unreadPmbNotifications.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jadwal seleksi</p>
          <p className="mt-2 text-lg font-black text-slate-950">{registration?.status_seleksi === "LULUS" ? "Selesai" : registration ? "Menunggu" : "-"}</p>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Tahapan PMB</h2>
            <p className="text-sm text-slate-500">Urutan langkah untuk calon mahasiswa.</p>
          </div>
          <Link href="/pmb" className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">
            Lihat portal PMB
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step) => (
            <Link
              key={step.key}
              href={step.href}
              className={`rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                step.status === "done"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : step.status === "current"
                    ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <div className="flex items-start gap-3">
                {step.status === "done" ? <CheckCircle2 className="mt-0.5 h-5 w-5" /> : step.status === "current" ? <Clock3 className="mt-0.5 h-5 w-5" /> : <GraduationCap className="mt-0.5 h-5 w-5" />}
                <div>
                  <p className="font-black">{step.label}</p>
                  <p className="mt-1 text-sm opacity-85">{step.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Mail className="h-5 w-5 text-cyan-700" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notifikasi PMB</p>
              <h3 className="text-base font-black text-slate-950">Info terbaru untuk akun ini</h3>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {notifications.items.length ? notifications.items.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">{item.judul}</p>
                <p className="mt-1 text-sm text-slate-600">{item.pesan}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDate(item.created_at)}</p>
              </div>
            )) : (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Belum ada notifikasi PMB.</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <WalletCards className="h-5 w-5 text-emerald-700" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aksi cepat</p>
              <h3 className="text-base font-black text-slate-950">Akses yang paling sering dipakai</h3>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <Link href="/dashboard/keuangan?tab=pmb" className="flex min-h-[44px] items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Bayar invoice PMB <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/dashboard/keuangan?tab=pmb" className="flex min-h-[44px] items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Upload bukti manual <Upload className="h-4 w-4" />
            </Link>
            <Link href="/dashboard/notifikasi" className="flex min-h-[44px] items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Lihat jadwal seleksi <CalendarDays className="h-4 w-4" />
            </Link>
            <Link href="/dashboard/notifikasi" className="flex min-h-[44px] items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Lihat hasil seleksi <FileText className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
