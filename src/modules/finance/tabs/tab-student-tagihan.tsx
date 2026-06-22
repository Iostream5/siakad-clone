"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  Receipt,
  Search,
  WalletCards,
} from "lucide-react";

import { requestFinancePaymentGatewayAction } from "@/actions/finance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import type {
  FinancePaymentStatus,
  FinanceTagihanStatus,
  StudentLedgerBill,
  StudentLedgerData,
} from "@/lib/admin/finance";
import { formatCurrency } from "@/lib/utils";

interface TabStudentTagihanProps {
  ledger: StudentLedgerData | null;
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

function canPayBill(bill: StudentLedgerBill | null) {
  return Boolean(bill && bill.status === "Belum Lunas" && bill.remaining > 0);
}

export default function TabStudentTagihan({ ledger }: TabStudentTagihanProps) {
  const searchParams = useSearchParams();
  const initialBillId = searchParams.get("tagihan");
  const [query, setQuery] = useState("");
  const [selectedBillId, setSelectedBillId] = useState<string | null>(initialBillId);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const { error } = useToast();

  const bills = ledger?.tagihan ?? [];
  const selectedBill = bills.find((item) => item.id === selectedBillId) ?? null;
  const selectedPayments = selectedBill
    ? (ledger?.pembayaran ?? []).filter((item) => item.tagihan_id === selectedBill.id)
    : [];

  const keyword = query.trim().toLowerCase();
  const filteredBills = keyword
    ? bills.filter((item) => (
        item.jenis.toLowerCase().includes(keyword) ||
        item.status.toLowerCase().includes(keyword) ||
        item.tahun_akademik?.nama?.toLowerCase().includes(keyword)
      ))
    : bills;

  useEffect(() => {
    if (selectedBill) {
      // Avoid setting state here directly if it causes issues, but for now we set it to default
    }
  }, [selectedBill]);

  const handlePay = async () => {
    if (!selectedBill || !canPayBill(selectedBill)) return;
    if (!paymentAmount || paymentAmount <= 0 || paymentAmount > selectedBill.remaining) {
      error("Gagal membuat pembayaran", "Nominal pembayaran tidak valid.");
      return;
    }

    setIsPaying(true);
    try {
      const result = await requestFinancePaymentGatewayAction(selectedBill.id, Number(paymentAmount));
      if (result.success && result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }

      error("Gagal membuat pembayaran", result.error || "Payment gateway belum bisa dipakai.");
    } catch {
      error("Gagal membuat pembayaran", "Terjadi kesalahan sistem saat menghubungi payment gateway.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <>
      <Card className="min-h-[600px] overflow-hidden rounded-none border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b-2 border-slate-50 bg-white p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <button className="border-b-2 border-emerald-600 pb-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
              Daftar Tagihan
            </button>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Tagihan atas nama {ledger?.mahasiswa?.name ?? "mahasiswa"}.
            </p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari tagihan..."
              className="h-10 rounded-none border-2 border-slate-100 bg-white pl-10 text-[10px] font-bold focus:border-emerald-600"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-2">
          {filteredBills.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedBillId(item.id)}
              className="group rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black uppercase text-slate-900">{item.jenis}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {item.tahun_akademik?.nama ?? "Tahun akademik belum diisi"}
                  </p>
                </div>
                <Badge variant={tagihanVariant(item.status)} className="shrink-0 rounded-md text-[9px] font-black uppercase tracking-widest">
                  {item.status}
                </Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nominal</p>
                  <p className="mt-1 font-mono text-sm font-black text-slate-900">{formatCurrency(item.nominal)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sisa</p>
                  <p className="mt-1 font-mono text-sm font-black text-rose-700">{formatCurrency(item.remaining)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Jatuh tempo</p>
                  <p className="mt-1 text-xs font-bold text-slate-700">{formatDate(item.jatuh_tempo)}</p>
                </div>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${item.progressPercent}%` }} />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold text-slate-500">
                  Dibayar {formatCurrency(item.totalPaid)}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  Detail <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          ))}

          {filteredBills.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <Receipt className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Belum ada tagihan</p>
              <p className="mt-2 text-xs text-slate-500">Kalau tagihan sudah dibuat, nanti muncul di sini.</p>
            </div>
          ) : null}
        </div>
      </Card>

      <Dialog open={Boolean(selectedBill)} onOpenChange={(open) => !open && setSelectedBillId(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-lg bg-white p-0">
          <DialogHeader className="border-b border-slate-100 p-6">
            <DialogTitle className="flex items-center gap-3 text-xl font-black text-slate-900">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Receipt className="h-5 w-5" />
              </span>
              Detail Tagihan
            </DialogTitle>
            <DialogDescription>
              Rincian tagihan dan metode pembayaran yang tersedia.
            </DialogDescription>
          </DialogHeader>

          {selectedBill ? (
            <div className="space-y-6 p-6">
              <section className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nama tagihan</p>
                  <p className="mt-2 text-lg font-black uppercase text-slate-900">{selectedBill.jenis}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{selectedBill.tahun_akademik?.nama ?? "Tahun akademik belum diisi"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</p>
                  <Badge variant={tagihanVariant(selectedBill.status)} className="mt-2 rounded-md text-[9px] font-black uppercase tracking-widest">
                    {selectedBill.status}
                  </Badge>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Jatuh tempo</p>
                  <p className="mt-2 text-sm font-black text-slate-900">{formatDate(selectedBill.jatuh_tempo)}</p>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nominal</p>
                    <WalletCards className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-3 font-mono text-xl font-black text-slate-900">{formatCurrency(selectedBill.nominal)}</p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Dibayar</p>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-3 font-mono text-xl font-black text-emerald-800">{formatCurrency(selectedBill.totalPaid)}</p>
                </div>
                <div className="rounded-lg border border-rose-100 bg-rose-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">Sisa</p>
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                  </div>
                  <p className="mt-3 font-mono text-xl font-black text-rose-800">{formatCurrency(selectedBill.remaining)}</p>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <h4 className="text-sm font-black text-slate-900">Metode pembayaran</h4>
                  <p className="text-xs font-medium text-slate-500">Gunakan pembayaran online untuk membuat checkout tagihan ini.</p>
                </div>
                <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">Payment Gateway</p>
                      <p className="text-xs font-medium text-slate-500">Sistem akan membuka halaman checkout pembayaran.</p>
                    </div>
                  </div>

                  {canPayBill(selectedBill) && (
                    <div className="flex flex-col md:flex-row items-center gap-3">
                      <Input
                        type="number"
                        min={1}
                        max={selectedBill.remaining}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : "")}
                        placeholder="Nominal"
                        className="w-full md:w-32 h-10"
                      />
                    </div>
                  )}

                  <Button
                    type="button"
                    disabled={!canPayBill(selectedBill) || isPaying}
                    onClick={handlePay}
                    className="h-10 rounded-none bg-emerald-600 px-5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700 disabled:bg-slate-300"
                  >
                    {isPaying ? "Memproses..." : "Bayar Online"}
                  </Button>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <Clock3 className="h-4 w-4 text-slate-400" />
                  <h4 className="text-sm font-black text-slate-900">Riwayat pembayaran tagihan ini</h4>
                </div>
                <div className="divide-y divide-slate-100">
                  {selectedPayments.map((item) => (
                    <div key={item.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-black text-slate-900">{formatDate(item.tanggal_bayar, true)}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">{item.metode}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-sm font-black text-slate-900">{formatCurrency(item.nominal)}</p>
                        <Badge variant={pembayaranVariant(item.status)} className="rounded-md text-[9px] font-black uppercase tracking-widest">
                          {item.status}
                        </Badge>
                        {item.bukti_url ? (
                          <a
                            href={item.bukti_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-cyan-700 hover:text-cyan-900"
                          >
                            Bukti <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}

                  {selectedPayments.length === 0 ? (
                    <p className="p-8 text-center text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">
                      Belum ada pembayaran
                    </p>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
