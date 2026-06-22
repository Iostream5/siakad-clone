"use client";

import { Plus } from "lucide-react";

import { createCashFlowAction } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

type CashFlowItem = {
  id: string;
  tanggal: string;
  tipe: "Masuk" | "Keluar" | string;
  judul: string;
  deskripsi?: string | null;
  nominal: number | string;
  kategori_id?: string | null;
  kategori?: {
    nama?: string | null;
    tipe?: string | null;
  } | null;
};

type CategoryItem = {
  id: string;
  nama: string;
  tipe: string;
};

type TabCashflowProps = {
  cashFlow: CashFlowItem[];
  categories: CategoryItem[];
  canMutate: boolean;
};

export default function TabCashflow({ cashFlow, categories, canMutate }: TabCashflowProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-12">
      {canMutate ? (
        <Card className="rounded-none border-slate-100 bg-white p-6 shadow-sm xl:col-span-4">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Arus Kas</p>
            <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-slate-900">Catat Transaksi</h3>
          </div>
          <form action={createCashFlowAction} className="grid gap-4">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Tanggal</label>
              <Input name="tanggal" type="date" required className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Tipe</label>
                <select name="tipe" className="h-11 w-full rounded-none border-2 border-slate-100 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-emerald-500">
                  <option value="Masuk">Masuk</option>
                  <option value="Keluar">Keluar</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Kategori</label>
                <select name="kategoriId" className="h-11 w-full rounded-none border-2 border-slate-100 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-emerald-500" required>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>{item.nama}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Judul</label>
              <Input name="judul" required className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Deskripsi</label>
              <Input name="deskripsi" className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Nominal</label>
              <Input name="nominal" type="number" min={1} step={1000} required className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
            </div>
            <Button className="h-11 rounded-none bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" /> Simpan Transaksi
            </Button>
          </form>
        </Card>
      ) : null}

      <Card className={canMutate ? "overflow-hidden rounded-none border-slate-100 bg-white shadow-sm xl:col-span-8" : "overflow-hidden rounded-none border-slate-100 bg-white shadow-sm xl:col-span-12"}>
        <div className="border-b border-slate-50 bg-slate-50/50 p-6">
          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Riwayat Arus Kas</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Transaksi masuk dan keluar yang tercatat.</p>
        </div>
        <Table>
          <THead className="bg-slate-50/50">
            <TR><TH className="pl-6 text-[10px]">Tanggal</TH><TH className="text-[10px]">Transaksi</TH><TH className="text-[10px]">Tipe</TH><TH className="text-[10px]">Kategori</TH><TH className="pr-6 text-right text-[10px]">Nominal</TH></TR>
          </THead>
          <TBody>
            {cashFlow.map((item) => (
              <TR key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <TD className="pl-6 text-[10px] font-bold text-slate-500">{new Date(item.tanggal).toLocaleDateString("id-ID")}</TD>
                <TD>
                  <p className="text-xs font-black text-slate-900">{item.judul}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{item.deskripsi ?? "-"}</p>
                </TD>
                <TD className={item.tipe === "Masuk" ? "text-xs font-black text-emerald-600" : "text-xs font-black text-rose-600"}>{item.tipe}</TD>
                <TD className="text-xs font-bold text-slate-600">{item.kategori?.nama ?? "-"}</TD>
                <TD className="pr-6 text-right font-mono text-xs font-black text-slate-900">{formatCurrency(Number(item.nominal))}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
