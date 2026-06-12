"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, GraduationCap, FileText, Banknote, History, Wallet, UserCheck, AlertCircle } from "lucide-react";
import type { SessionUser } from "@/types/domain";

type PimpinanStats = {
  mahasiswaAktif: number;
  dosenAktif: number;
  pmb: {
    total: number;
    lulus: number;
    ditolak: number;
    proses: number;
  };
  keuangan: {
    totalTagihan: number;
    totalPembayaranMasuk: number;
    totalTunggakan: number;
    tagihanLunas: number;
  };
};

export function PimpinanOverview({
  user,
  stats
}: {
  user: SessionUser;
  stats: PimpinanStats;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Pimpinan</h2>
          <p className="text-sm text-slate-500">Ringkasan kondisi akademik, PMB, dan keuangan kampus.</p>
        </div>
      </div>

      {/* Row 1: Akademik & PMB Quick Stats */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-slate-200/60 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-3">
             <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
               <GraduationCap className="h-5 w-5" />
             </div>
             <div>
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Mahasiswa</p>
               <h3 className="text-2xl font-bold text-slate-900">{stats.mahasiswaAktif.toLocaleString("id-ID")}</h3>
             </div>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 text-[10px]">AKTIF</Badge>
        </Card>

        <Card className="p-4 border-slate-200/60 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-3">
             <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
               <UserCheck className="h-5 w-5" />
             </div>
             <div>
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dosen</p>
               <h3 className="text-2xl font-bold text-slate-900">{stats.dosenAktif.toLocaleString("id-ID")}</h3>
             </div>
          </div>
          <Badge className="bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-50 text-[10px]">AKTIF</Badge>
        </Card>

        <Card className="p-4 border-slate-200/60 shadow-sm bg-white md:col-span-2">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                 <Users className="h-5 w-5" />
               </div>
               <div>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pendaftar PMB</p>
                 <h3 className="text-2xl font-bold text-slate-900">{stats.pmb.total.toLocaleString("id-ID")}</h3>
               </div>
             </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Lulus</p>
              <p className="font-bold text-emerald-600">{stats.pmb.lulus}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Proses</p>
              <p className="font-bold text-amber-600">{stats.pmb.proses}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Ditolak</p>
              <p className="font-bold text-rose-600">{stats.pmb.ditolak}</p>
            </div>
          </div>
        </Card>
      </section>

      {/* Row 2: Keuangan */}
      <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Ringkasan Keuangan</h3>
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-6 border-slate-200/60 shadow-sm bg-white">
           <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
             <FileText className="h-6 w-6" />
           </div>
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tagihan (Rp)</p>
           <h3 className="text-3xl font-bold text-slate-900 mt-1">
             {stats.keuangan.totalTagihan.toLocaleString("id-ID")}
           </h3>
           <p className="text-xs text-slate-500 mt-2">{stats.keuangan.tagihanLunas} tagihan lunas tercatat</p>
        </Card>

        <Card className="p-6 border-slate-200/60 shadow-sm bg-white">
           <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
             <Wallet className="h-6 w-6" />
           </div>
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pembayaran Masuk (Rp)</p>
           <h3 className="text-3xl font-bold text-emerald-600 mt-1">
             {stats.keuangan.totalPembayaranMasuk.toLocaleString("id-ID")}
           </h3>
           <p className="text-xs text-slate-500 mt-2">Dari transaksi terverifikasi</p>
        </Card>

        <Card className="p-6 border-rose-100 shadow-sm bg-rose-50/30">
           <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
             <AlertCircle className="h-6 w-6" />
           </div>
           <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Total Tunggakan (Rp)</p>
           <h3 className="text-3xl font-bold text-rose-600 mt-1">
             {stats.keuangan.totalTunggakan.toLocaleString("id-ID")}
           </h3>
           <p className="text-xs text-rose-500 mt-2">Estimasi piutang mahasiswa aktif</p>
        </Card>
      </section>

    </div>
  );
}
