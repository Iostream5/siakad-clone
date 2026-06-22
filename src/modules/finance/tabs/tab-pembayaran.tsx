"use client";

import { useState } from "react";
import { ChevronRight, FileText, Landmark, ReceiptText } from "lucide-react";

import { verifyPmbPaymentAction } from "@/actions/pmb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

type PaymentItem = {
  id: string;
  nominal: number | string;
  status: string;
  metode: string;
  bukti_url?: string | null;
  tagihan?: {
    jenis?: string | null;
    mahasiswa?: {
      id?: string;
      nim?: string | null;
      users?: {
        full_name?: string | null;
      } | null;
    } | null;
  } | null;
};

type PmbPaymentItem = {
  id: string;
  tanggal_bayar: string;
  nominal: number | string;
  metode: string;
  bukti_url?: string | null;
  status: string;
  pmb_pendaftaran?: {
    nomor_pendaftaran?: string | null;
    nama_lengkap?: string | null;
    email?: string | null;
    program_studi?: {
      nama?: string | null;
    } | null;
  } | null;
};

type CashFlowItem = {
  id: string;
  tanggal: string;
  tipe: string;
  judul: string;
  deskripsi?: string | null;
  nominal: number | string;
  kategori?: {
    nama?: string | null;
    tipe?: string | null;
  } | null;
};

type StudentOption = {
  id: string;
  nim?: string | null;
  users?: {
    full_name?: string | null;
  } | null;
};

interface TabPembayaranProps {
  pembayaran: PaymentItem[];
  pmbPembayaran: PmbPaymentItem[];
  cashFlow: CashFlowItem[];
  mahasiswaList: StudentOption[];
  onViewLedger: (id: string) => void;
  verifyAction: (id: string, status: string) => void;
  canVerify: boolean;
}

type PaymentMode = "mahasiswa" | "pmb" | "riwayat";

function statusVariant(status: string): "success" | "destructive" | "outline" {
  if (status === "Terverifikasi") return "success";
  if (status === "Ditolak" || status === "Gagal") return "destructive";
  return "outline";
}

export default function TabPembayaran({
  pembayaran,
  pmbPembayaran,
  cashFlow,
  mahasiswaList,
  onViewLedger,
  verifyAction,
  canVerify,
}: TabPembayaranProps) {
  const [mode, setMode] = useState<PaymentMode>("mahasiswa");

  return (
    <Card className="min-h-[600px] overflow-hidden rounded-none border-slate-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-50 bg-white p-6">
        {[
          ["mahasiswa", "Pembayaran Mahasiswa"],
          ["pmb", "Pembayaran Calon Mahasiswa"],
          ["riwayat", "Riwayat Penerimaan"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key as PaymentMode)}
            className={mode === key
              ? "border-b-2 border-emerald-600 pb-2 text-[10px] font-black uppercase tracking-widest text-emerald-600"
              : "pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400"}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "mahasiswa" ? (
        <>
          <div className="p-12 text-center">
            <div className="mx-auto max-w-xl space-y-6">
              <h4 className="inline-block border-b border-emerald-600 px-12 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-900">Cari Mahasiswa</h4>
              <div className="relative">
                <select
                  className="h-14 w-full cursor-pointer appearance-none rounded-none border-2 border-slate-100 bg-slate-50 px-6 text-sm font-bold text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white"
                  onChange={(e) => e.target.value && onViewLedger(e.target.value)}
                >
                  <option value="">Ketik nama Mahasiswa atau NIM...</option>
                  {mahasiswaList.map((item) => (
                    <option key={item.id} value={item.id}>{item.nim} - {item.users?.full_name}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-6 top-1/2 h-5 w-5 -translate-y-1/2 rotate-90 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-50">
            <Table>
              <THead className="bg-slate-50/50">
                <TR><TH className="pl-6 text-[10px]">Mahasiswa & Bukti</TH><TH className="text-[10px]">Tagihan</TH><TH className="text-[10px]">Nominal</TH><TH className="text-[10px]">Status</TH><TH className="pr-6 text-right text-[10px]">Verifikasi</TH></TR>
              </THead>
              <TBody>
                {pembayaran.map((item) => (
                  <TR key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <TD className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-none border border-slate-200 bg-slate-100"><FileText className="h-5 w-5 text-slate-400" /></div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{item.tagihan?.mahasiswa?.users?.full_name || "Mahasiswa"}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tighter text-emerald-600">{item.metode}</span>
                            {item.bukti_url ? <a href={item.bukti_url} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-widest text-cyan-600 hover:underline">Lihat Bukti</a> : null}
                          </div>
                        </div>
                      </div>
                    </TD>
                    <TD className="text-xs font-black text-slate-700">{item.tagihan?.jenis ?? "-"}</TD>
                    <TD className="font-mono text-xs font-black text-emerald-600">{formatCurrency(Number(item.nominal))}</TD>
                    <TD><Badge variant={statusVariant(item.status)} className="h-5 rounded-none px-3 text-[8px] font-black uppercase">{item.status}</Badge></TD>
                    <TD className="pr-6">
                      {canVerify && item.status === "Menunggu" ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => verifyAction(item.id, "Terverifikasi")} className="h-8 rounded-none bg-emerald-600 px-4 text-[8px] font-black uppercase text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700">Terima</Button>
                          <Button size="sm" variant="outline" onClick={() => verifyAction(item.id, "Ditolak")} className="h-8 rounded-none border-rose-200 px-4 text-[8px] font-black uppercase text-rose-600 hover:bg-rose-50">Tolak</Button>
                        </div>
                      ) : null}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </>
      ) : null}

      {mode === "pmb" ? (
        <Table>
          <THead className="bg-slate-50/50">
            <TR><TH className="pl-6 text-[10px]">Calon Mahasiswa</TH><TH className="text-[10px]">Nominal</TH><TH className="text-[10px]">Metode</TH><TH className="text-[10px]">Status</TH><TH className="pr-6 text-right text-[10px]">Verifikasi</TH></TR>
          </THead>
          <TBody>
            {pmbPembayaran.map((item) => (
              <TR key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <TD className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center bg-cyan-50 text-cyan-700"><ReceiptText className="h-5 w-5" /></div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{item.pmb_pendaftaran?.nama_lengkap ?? "Calon Mahasiswa"}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{item.pmb_pendaftaran?.nomor_pendaftaran ?? "-"} / {item.pmb_pendaftaran?.program_studi?.nama ?? "-"}</p>
                    </div>
                  </div>
                </TD>
                <TD className="font-mono text-xs font-black text-emerald-600">{formatCurrency(Number(item.nominal))}</TD>
                <TD className="text-xs font-bold text-slate-600">{item.metode}</TD>
                <TD><Badge variant={statusVariant(item.status)} className="h-5 rounded-none px-3 text-[8px] font-black uppercase">{item.status}</Badge></TD>
                <TD className="pr-6">
                  {canVerify && item.status === "Menunggu" ? (
                    <div className="flex justify-end gap-2">
                      <form action={verifyPmbPaymentAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="status" value="Terverifikasi" />
                        <input type="hidden" name="redirectTo" value="/dashboard/keuangan?tab=pembayaran" />
                        <Button size="sm" className="h-8 rounded-none bg-emerald-600 px-4 text-[8px] font-black uppercase text-white hover:bg-emerald-700">Terima</Button>
                      </form>
                      <form action={verifyPmbPaymentAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="status" value="Ditolak" />
                        <input type="hidden" name="redirectTo" value="/dashboard/keuangan?tab=pembayaran" />
                        <Button size="sm" variant="outline" className="h-8 rounded-none border-rose-200 px-4 text-[8px] font-black uppercase text-rose-600 hover:bg-rose-50">Tolak</Button>
                      </form>
                    </div>
                  ) : null}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : null}

      {mode === "riwayat" ? (
        <Table>
          <THead className="bg-slate-50/50">
            <TR><TH className="pl-6 text-[10px]">Tanggal</TH><TH className="text-[10px]">Transaksi</TH><TH className="text-[10px]">Kategori</TH><TH className="pr-6 text-right text-[10px]">Nominal</TH></TR>
          </THead>
          <TBody>
            {cashFlow.filter((item) => item.tipe === "Masuk").map((item) => (
              <TR key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <TD className="pl-6 text-[10px] font-bold text-slate-500">{new Date(item.tanggal).toLocaleDateString("id-ID")}</TD>
                <TD>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center bg-emerald-50 text-emerald-700"><Landmark className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{item.judul}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{item.deskripsi ?? "-"}</p>
                    </div>
                  </div>
                </TD>
                <TD className="text-xs font-bold text-slate-600">{item.kategori?.nama ?? "-"}</TD>
                <TD className="pr-6 text-right font-mono text-xs font-black text-emerald-600">{formatCurrency(Number(item.nominal))}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : null}
    </Card>
  );
}
