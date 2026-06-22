"use client";

import { ExternalLink, FileText, History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { FinancePaymentStatus, StudentLedgerData } from "@/lib/admin/finance";
import { formatCurrency } from "@/lib/utils";

interface TabStudentPembayaranProps {
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

function pembayaranVariant(status: FinancePaymentStatus) {
  if (status === "Terverifikasi") return "success";
  if (status === "Ditolak") return "destructive";
  return "outline";
}

export default function TabStudentPembayaran({ ledger }: TabStudentPembayaranProps) {
  const payments = ledger?.pembayaran ?? [];

  return (
    <Card className="min-h-[600px] overflow-hidden rounded-none border-slate-100 bg-white shadow-sm">
      <div className="flex items-center gap-4 border-b-2 border-slate-50 bg-white p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
          <History className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">Riwayat Pembayaran</h3>
          <p className="text-xs font-medium text-slate-500">Daftar transaksi pembayaran milik mahasiswa login.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <THead className="bg-slate-50/50">
            <TR>
              <TH className="pl-6 text-[10px]">Tanggal & Metode</TH>
              <TH className="text-[10px]">Tagihan</TH>
              <TH className="text-[10px]">Nominal</TH>
              <TH className="text-[10px]">Bukti</TH>
              <TH className="pr-6 text-right text-[10px]">Status</TH>
            </TR>
          </THead>
          <TBody>
            {payments.map((item) => (
              <TR key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <TD className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
                      <FileText className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{formatDate(item.tanggal_bayar, true)}</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">{item.metode}</p>
                    </div>
                  </div>
                </TD>
                <TD>
                  <p className="text-xs font-black text-slate-800">{item.tagihan?.jenis ?? "-"}</p>
                  <p className="mt-1 text-[10px] font-medium text-slate-400">{item.tagihan?.tahun_akademik?.nama ?? "-"}</p>
                  {item.provider === "midtrans" && item.provider_reference ? (
                    <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-cyan-700">
                      Order {item.provider_reference}
                    </p>
                  ) : null}
                </TD>
                <TD className="whitespace-nowrap font-mono text-xs font-black text-emerald-700">{formatCurrency(item.nominal)}</TD>
                <TD>
                  {item.bukti_url || item.checkout_url ? (
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
                <TD className="pr-6 text-right">
                  <Badge variant={pembayaranVariant(item.status)} className="rounded-md text-[9px] font-black uppercase tracking-widest">
                    {item.status}
                  </Badge>
                </TD>
              </TR>
            ))}

            {payments.length === 0 ? (
              <TR>
                <TD colSpan={5} className="py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  Belum ada pembayaran
                </TD>
              </TR>
            ) : null}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}
