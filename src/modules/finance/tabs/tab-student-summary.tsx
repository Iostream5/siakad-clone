"use client";

import { AlertTriangle, CheckCircle2, Clock3, ReceiptText, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { StudentLedgerData } from "@/lib/admin/finance";
import { formatCurrency } from "@/lib/utils";

interface TabStudentSummaryProps {
  ledger: StudentLedgerData | null;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function TabStudentSummary({ ledger }: TabStudentSummaryProps) {
  const summary = ledger?.summary;
  const nearestBill = ledger?.tagihan
    .filter((item) => item.status === "Belum Lunas")
    .sort((left, right) => new Date(left.jatuh_tempo).getTime() - new Date(right.jatuh_tempo).getTime())[0];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
      <Card className="overflow-hidden rounded-none border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">Ringkasan keuangan saya</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              {ledger?.mahasiswa?.name ?? "Mahasiswa"}
            </h3>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              {ledger?.mahasiswa?.nim ?? "-"} / {ledger?.mahasiswa?.programStudi ?? "Program studi belum diisi"}
            </p>
          </div>
          <Badge variant="outline" className="w-fit rounded-md px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            {ledger?.mahasiswa?.status ?? "Status belum diisi"}
          </Badge>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total tagihan</p>
              <WalletCards className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-3 font-mono text-xl font-black text-slate-900">{formatCurrency(summary?.totalBilled ?? 0)}</p>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Sudah dibayar</p>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-3 font-mono text-xl font-black text-emerald-800">{formatCurrency(summary?.totalVerifiedPaid ?? 0)}</p>
          </div>

          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Menunggu</p>
              <Clock3 className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-3 font-mono text-xl font-black text-amber-800">{formatCurrency(summary?.totalPendingPaid ?? 0)}</p>
          </div>

          <div className="rounded-lg border border-rose-100 bg-rose-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">Sisa tagihan</p>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <p className="mt-3 font-mono text-xl font-black text-rose-800">{formatCurrency(summary?.outstanding ?? 0)}</p>
          </div>
        </div>
      </Card>

      <Card className="rounded-none border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Tagihan terdekat</h4>
              <p className="text-xs font-medium text-slate-500">
                {summary?.paidBills ?? 0} lunas, {summary?.unpaidBills ?? 0} belum lunas, {summary?.overdueBills ?? 0} lewat tempo
              </p>
            </div>
          </div>

          {nearestBill ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left lg:min-w-80">
              <p className="text-xs font-black uppercase text-slate-900">{nearestBill.jenis}</p>
              <p className="mt-1 font-mono text-sm font-black text-rose-700">{formatCurrency(nearestBill.remaining)}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Jatuh tempo {formatDate(nearestBill.jatuh_tempo)}
              </p>
            </div>
          ) : (
            <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
              Belum ada tagihan aktif.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
