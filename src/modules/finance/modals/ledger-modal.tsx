"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { requestFinancePaymentGatewayAction } from "@/actions/finance";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  History,
  Receipt,
  WalletCards,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type {
  FinancePaymentStatus,
  FinanceTagihanStatus,
  StudentLedgerData,
  StudentLedgerProfile,
} from "@/lib/admin/finance";
import { formatCurrency } from "@/lib/utils";

type LedgerStudentSummary = {
  id: string;
  nim: string | null;
  angkatan?: number | null;
  status_mahasiswa?: string | null;
  users?: {
    full_name?: string | null;
    email?: string | null;
  } | null;
  program_studi?: {
    nama?: string | null;
  } | null;
};

interface LedgerModalProps {
  student: LedgerStudentSummary | null;
  ledgerData: StudentLedgerData;
  onClose: () => void;
  userRole?: string;
}

function formatDate(value?: string | null, withTime = false) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function tagihanVariant(status: FinanceTagihanStatus) {
  if (status === "Lunas") return "success";
  if (status === "Dispensasi") return "outline";
  return "destructive";
}

function pembayaranVariant(status: FinancePaymentStatus) {
  if (status === "Terverifikasi") return "success";
  if (status === "Ditolak") return "destructive";
  return "outline";
}

function buildStudentProfile(student: LedgerStudentSummary | null, ledgerData: StudentLedgerData): StudentLedgerProfile {
  if (ledgerData.mahasiswa) return ledgerData.mahasiswa;

  return {
    id: student?.id ?? "",
    nim: student?.nim ?? null,
    name: student?.users?.full_name ?? "Mahasiswa",
    email: student?.users?.email ?? null,
    angkatan: student?.angkatan ?? null,
    status: student?.status_mahasiswa ?? null,
    programStudi: student?.program_studi?.nama ?? null,
  };
}

export default function LedgerModal({ student, ledgerData, onClose, userRole }: LedgerModalProps) {
  const profile = buildStudentProfile(student, ledgerData);
  const { summary } = ledgerData;
  const isStudent = userRole === "Mahasiswa";
  const [isPaying, setIsPaying] = useState<string | null>(null);
  const router = useRouter();
  const { error } = useToast();

  const handlePayMidtrans = async (tagihanId: string) => {
    setIsPaying(tagihanId);
    try {
      const result = await requestFinancePaymentGatewayAction(tagihanId);
      if (result.success && result.checkoutUrl) {
        router.push(result.checkoutUrl);
      } else {
        error("Gagal", result.error || "Gagal membuat koneksi pembayaran.");
      }
    } catch {
      error("Error", "Terjadi kesalahan sistem saat menghubungi payment gateway.");
    } finally {
      setIsPaying(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-label="Riwayat pembayaran mahasiswa"
        className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg border-none bg-white p-0 shadow-2xl ring-1 ring-white/20"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex flex-col gap-5 border-b border-slate-100 bg-white/95 p-5 backdrop-blur md:flex-row md:items-center md:justify-between md:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg shadow-emerald-100">
              <Receipt className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Riwayat pembayaran</p>
              <h3 className="truncate text-xl font-black text-slate-900 md:text-2xl">{profile.name}</h3>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {profile.nim ?? "-"} / {profile.programStudi ?? "Program studi belum diisi"} / Angkatan {profile.angkatan ?? "-"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 md:justify-end">
            {profile.status ? (
              <Badge variant="outline" className="rounded-md px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                {profile.status}
              </Badge>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              aria-label="Tutup riwayat pembayaran"
              onClick={onClose}
              className="h-10 w-10 rounded-lg hover:bg-slate-100"
            >
              <XCircle className="h-5 w-5 text-slate-500" />
            </Button>
          </div>
        </div>

        <div className="space-y-8 p-5 md:p-6">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Tagihan</p>
                <WalletCards className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-3 font-mono text-xl font-black text-slate-900">{formatCurrency(summary.totalBilled)}</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Terverifikasi</p>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-3 font-mono text-xl font-black text-emerald-800">{formatCurrency(summary.totalVerifiedPaid)}</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Menunggu</p>
                <Clock3 className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-3 font-mono text-xl font-black text-amber-800">{formatCurrency(summary.totalPendingPaid)}</p>
            </div>
            <div className="rounded-lg border border-rose-100 bg-rose-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">Sisa Piutang</p>
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
              <p className="mt-3 font-mono text-xl font-black text-rose-800">{formatCurrency(summary.outstanding)}</p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Detail Tagihan</h4>
                    <p className="text-xs font-medium text-slate-500">{summary.paidBills} lunas, {summary.unpaidBills} belum lunas, {summary.overdueBills} lewat tempo</p>
                  </div>
                  <Badge variant="outline" className="w-fit rounded-md text-[10px] font-black uppercase tracking-widest">
                    {ledgerData.tagihan.length} invoice
                  </Badge>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <THead className="bg-white">
                      <TR>
                        <TH className="min-w-56 text-[10px]">Tagihan</TH>
                        <TH className="text-[10px]">Nominal</TH>
                        <TH className="text-[10px]">Dibayar</TH>
                        <TH className="text-[10px]">Sisa</TH>
                        <TH className="text-[10px]">Jatuh Tempo</TH>
                        <TH className="text-right text-[10px]">Status</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {ledgerData.tagihan.map((item) => (
                        <TR key={item.id} className="border-b border-slate-50">
                          <TD>
                            <p className="text-xs font-black uppercase text-slate-900">{item.jenis}</p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {item.tahun_akademik?.nama ?? "Tahun akademik belum diisi"}
                            </p>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${item.progressPercent}%` }}
                              />
                            </div>
                          </TD>
                          <TD className="whitespace-nowrap font-mono text-xs font-black text-slate-900">{formatCurrency(item.nominal)}</TD>
                          <TD className="whitespace-nowrap font-mono text-xs font-black text-emerald-700">{formatCurrency(item.totalPaid)}</TD>
                          <TD className="whitespace-nowrap font-mono text-xs font-black text-rose-700">{formatCurrency(item.remaining)}</TD>
                          <TD>
                            <p className="text-xs font-bold text-slate-700">{formatDate(item.jatuh_tempo)}</p>
                            {item.isOverdue ? <p className="mt-1 text-[10px] font-black uppercase text-rose-600">Lewat tempo</p> : null}
                          </TD>
                          <TD className="text-right">
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={tagihanVariant(item.status)} className="rounded-md text-[9px] font-black uppercase tracking-widest">
                                {item.status}
                              </Badge>
                              {isStudent && item.status !== "Lunas" && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handlePayMidtrans(item.id)}
                                  disabled={isPaying === item.id}
                                  className="h-7 px-3 text-[9px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                >
                                  {isPaying === item.id ? "Memproses..." : "Bayar Online"}
                                </Button>
                              )}
                            </div>
                          </TD>
                        </TR>
                      ))}
                      {ledgerData.tagihan.length === 0 ? (
                        <TR>
                          <TD colSpan={6} className="py-12 text-center text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">
                            Belum ada tagihan
                          </TD>
                        </TR>
                      ) : null}
                    </TBody>
                  </Table>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Detail Pembayaran</h4>
                    <p className="text-xs font-medium text-slate-500">Pembayaran terakhir: {formatDate(summary.lastPaymentAt, true)}</p>
                  </div>
                  <Badge variant="outline" className="w-fit rounded-md text-[10px] font-black uppercase tracking-widest">
                    {summary.paymentCount} transaksi
                  </Badge>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <THead className="bg-white">
                      <TR>
                        <TH className="min-w-52 text-[10px]">Tanggal & Metode</TH>
                        <TH className="text-[10px]">Tagihan</TH>
                        <TH className="text-[10px]">Nominal</TH>
                        <TH className="text-[10px]">Verifikator</TH>
                        <TH className="text-[10px]">Bukti</TH>
                        <TH className="text-right text-[10px]">Status</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {ledgerData.pembayaran.map((item) => (
                        <TR key={item.id} className="border-b border-slate-50">
                          <TD>
                            <p className="text-xs font-black text-slate-900">{formatDate(item.tanggal_bayar, true)}</p>
                            <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">{item.metode}</p>
                          </TD>
                          <TD>
                            <p className="text-xs font-bold text-slate-800">{item.tagihan?.jenis ?? "-"}</p>
                            <p className="mt-1 text-[10px] font-medium text-slate-400">{item.tagihan?.tahun_akademik?.nama ?? "-"}</p>
                          </TD>
                          <TD className="whitespace-nowrap font-mono text-xs font-black text-emerald-700">{formatCurrency(item.nominal)}</TD>
                          <TD>
                            <p className="text-xs font-bold text-slate-700">{item.verifiedBy ?? "-"}</p>
                            <p className="mt-1 text-[10px] font-medium text-slate-400">{formatDate(item.verified_at, true)}</p>
                          </TD>
                          <TD>
                            {(item.bukti_url || item.checkout_url) ? (
                              <a
                                href={item.bukti_url ?? item.checkout_url ?? "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-cyan-700 hover:text-cyan-900"
                              >
                                Lihat bukti <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-300">-</span>
                            )}
                          </TD>
                          <TD className="text-right">
                            <Badge variant={pembayaranVariant(item.status)} className="rounded-md text-[9px] font-black uppercase tracking-widest">
                              {item.status}
                            </Badge>
                          </TD>
                        </TR>
                      ))}
                      {ledgerData.pembayaran.length === 0 ? (
                        <TR>
                          <TD colSpan={6} className="py-12 text-center text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">
                            Belum ada pembayaran
                          </TD>
                        </TR>
                      ) : null}
                    </TBody>
                  </Table>
                </div>
              </div>
            </div>

            <aside className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                <History className="h-4 w-4 text-slate-400" />
                <h4 className="text-sm font-black text-slate-900">Timeline</h4>
              </div>
              <div className="max-h-[34rem] space-y-4 overflow-y-auto p-4">
                {ledgerData.timeline.slice(0, 12).map((item) => (
                  <div key={item.id} className="relative border-l-2 border-slate-100 pl-4">
                    <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{formatDate(item.date, true)}</p>
                    <p className="mt-1 text-xs font-black text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="font-mono text-xs font-black text-slate-800">{formatCurrency(item.amount)}</span>
                      <Badge
                        variant={item.type === "tagihan" ? tagihanVariant(item.status as FinanceTagihanStatus) : pembayaranVariant(item.status as FinancePaymentStatus)}
                        className="rounded-md text-[8px] font-black uppercase"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {ledgerData.timeline.length === 0 ? (
                  <p className="py-10 text-center text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">
                    Belum ada aktivitas
                  </p>
                ) : null}
              </div>
            </aside>
          </section>
        </div>

        <div className="flex justify-end border-t border-slate-100 p-5 md:p-6">
          <Button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg bg-slate-900 px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-lg hover:bg-black"
          >
            Selesai Review
          </Button>
        </div>
      </Card>
    </div>
  );
}
