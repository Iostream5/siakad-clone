"use client";

import { BadgeCheck, Clock3, CreditCard, FileUp, Landmark, ReceiptText, ShieldCheck } from "lucide-react";

import { requestPmbPaymentGatewayAction, submitPmbTransferPaymentAction } from "@/actions/pmb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type PmbPortalPayment = {
  id: string;
  tanggal_bayar: string;
  nominal: number | string;
  metode: string;
  bank_pengirim: string | null;
  nama_pengirim: string | null;
  bukti_signed_url?: string | null;
  status: string;
};

export type PmbPortalData = {
  registration: {
    id: string;
    nomor_pendaftaran: string;
    nama_lengkap: string;
    email: string;
    status_pendaftaran: string | null;
    status_pembayaran: string | null;
    status_seleksi: string;
    invoice_number: string | null;
    invoice_amount: number | string | null;
    invoice_due_at: string | null;
    program_studi?: { nama?: string | null } | null;
    pmb_biaya?: { nama?: string | null } | null;
  } | null;
  payments: PmbPortalPayment[];
  gateway: {
    enabled: boolean;
    provider: "midtrans" | "xendit" | null;
    message: string;
  };
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { dateStyle: "medium" });
}

function paymentBadge(status?: string | null) {
  if (status === "paid") return "bg-emerald-100 text-emerald-700";
  if (status === "manual_review") return "bg-indigo-100 text-indigo-700";
  if (status === "expired" || status === "failed" || status === "refund") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

export default function TabPmbPayment({ portal }: { portal: PmbPortalData | null }) {
  const registration = portal?.registration ?? null;

  if (!registration) {
    return (
      <Card className="rounded-lg border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <ReceiptText className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-lg font-black uppercase tracking-tight text-slate-900">Invoice PMB tidak ditemukan</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
          Akun ini belum terhubung dengan data pendaftaran PMB. Gunakan email yang dipakai saat mengisi formulir PMB.
        </p>
      </Card>
    );
  }

  const isPaid = registration.status_pembayaran === "paid";
  const latestPayment = portal?.payments[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-lg border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Invoice PMB</p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
                {registration.invoice_number ?? registration.nomor_pendaftaran}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {registration.nama_lengkap} - {registration.program_studi?.nama ?? "Program studi belum tersedia"}
              </p>
            </div>
            <Badge className={`rounded-md px-3 py-1 text-[10px] font-black uppercase ${paymentBadge(registration.status_pembayaran)}`}>
              {registration.status_pembayaran ?? "pending"}
            </Badge>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nominal</p>
              <p className="mt-2 text-xl font-black text-slate-900">{formatCurrency(Number(registration.invoice_amount ?? 0))}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jatuh Tempo</p>
              <p className="mt-2 text-sm font-black text-slate-900">{formatDate(registration.invoice_due_at)}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status PMB</p>
              <p className="mt-2 text-sm font-black text-slate-900">{registration.status_pendaftaran ?? "-"}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-lg border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-sm font-black uppercase tracking-widest text-emerald-800">Akun Pembayaran Aktif</h3>
          <p className="mt-2 text-sm leading-6 text-emerald-900">
            Pembayaran yang diunggah akan masuk ke panitia PMB untuk diverifikasi sebelum seleksi dibuka.
          </p>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-lg border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Gateway</p>
              <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                {portal?.gateway.provider?.toUpperCase() ?? "Gateway belum aktif"}
              </h3>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{portal?.gateway.message}</p>
          <form action={requestPmbPaymentGatewayAction} className="mt-5">
            <input type="hidden" name="pmbRegistrationId" value={registration.id} />
            <Button disabled={!portal?.gateway.enabled || isPaid} className="h-11 w-full rounded-lg bg-[var(--primary)] text-[10px] font-black uppercase tracking-widest text-white hover:bg-[var(--primary-strong)]">
              Bayar via Gateway
            </Button>
          </form>
        </Card>

        <Card className="rounded-lg border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transfer Bank</p>
              <h3 className="text-base font-black uppercase tracking-tight text-slate-900">Upload Bukti Transfer</h3>
            </div>
          </div>

          <form action={submitPmbTransferPaymentAction} encType="multipart/form-data" className="mt-5 grid gap-4">
            <input type="hidden" name="pmbRegistrationId" value={registration.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Nominal Transfer</label>
                <Input name="nominal" type="number" min={1} defaultValue={Number(registration.invoice_amount ?? 0)} className="h-11 rounded-lg font-bold" required disabled={isPaid} />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Bank Pengirim</label>
                <Input name="bankPengirim" placeholder="BCA / BRI / Mandiri" className="h-11 rounded-lg font-bold" required disabled={isPaid} />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Nama Pengirim</label>
              <Input name="namaPengirim" placeholder="Nama pemilik rekening" className="h-11 rounded-lg font-bold" required disabled={isPaid} />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Bukti Transfer</label>
              <Input name="proofFile" type="file" accept=".pdf,.jpg,.jpeg,.png" className="h-11 rounded-lg bg-white file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold" required disabled={isPaid} />
            </div>
            <Button disabled={isPaid} className="h-11 rounded-lg bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-black">
              <FileUp className="mr-2 h-4 w-4" /> Kirim Bukti Transfer
            </Button>
          </form>
        </Card>
      </section>

      <Card className="overflow-hidden rounded-lg border-slate-200 bg-white p-0 shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Riwayat pembayaran PMB</p>
        </div>
        <div className="divide-y divide-slate-100">
          {portal?.payments.length ? (
            portal.payments.map((payment) => (
              <div key={payment.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    {payment.status === "Terverifikasi" ? <BadgeCheck className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{payment.metode} - {formatCurrency(Number(payment.nominal))}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{formatDate(payment.tanggal_bayar)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {payment.bukti_signed_url ? (
                    <a href={payment.bukti_signed_url} target="_blank" className="text-[10px] font-black uppercase tracking-widest text-cyan-600 hover:underline">
                      Lihat bukti
                    </a>
                  ) : null}
                  <Badge className="rounded-md bg-slate-100 px-2 text-[8px] font-black uppercase text-slate-700">{payment.status}</Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
              Belum ada pembayaran terkirim
            </div>
          )}
        </div>
      </Card>

      {latestPayment?.status === "Menunggu" ? (
        <p className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-800">
          Bukti transfer terakhir sedang menunggu verifikasi panitia.
        </p>
      ) : null}
    </div>
  );
}
