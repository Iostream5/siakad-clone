"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function KeuanganDashboard({ user, stats }: { user: any, stats: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100">Pemasukan Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">Rp 12.5M</div>
            <p className="text-xs text-emerald-200 mt-1">+15% dari kemarin</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Perlu Verifikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-600">42</div>
            <p className="text-xs text-slate-500 mt-1">Pembayaran manual</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Target Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">68%</div>
            <p className="text-xs text-slate-500 mt-1">Tercapai</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tagihan Jatuh Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">124</div>
            <p className="text-xs text-slate-500 mt-1">Mahasiswa</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
         <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base font-bold text-slate-800">Grafik Tren Pembayaran</CardTitle>
            <CardDescription className="text-xs text-slate-500">Pemasukan 7 hari terakhir</CardDescription>
         </CardHeader>
         <CardContent className="p-6 h-64 flex items-center justify-center">
            <p className="text-sm text-slate-500">Grafik akan ditampilkan di sini.</p>
         </CardContent>
      </Card>
    </div>
  );
}
