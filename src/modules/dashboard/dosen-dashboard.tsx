"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DosenDashboard({ user, stats }: { user: any, stats: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-100">SKS Mengajar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">12</div>
            <p className="text-xs text-indigo-200 mt-1">Semester ini</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Mahasiswa Bimbingan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">45</div>
            <p className="text-xs text-slate-500 mt-1">Total mahasiswa</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Persetujuan KRS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-600">8</div>
            <p className="text-xs text-rose-600 font-medium mt-1">Perlu ditinjau</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tugas Belum Dinilai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">24</div>
            <p className="text-xs text-slate-500 mt-1">Dari 3 kelas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
               <CardTitle className="text-base font-bold text-slate-800">Jadwal Mengajar Hari Ini</CardTitle>
               <CardDescription className="text-xs text-slate-500">Daftar kelas yang harus Anda ampu hari ini.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-center">
               <p className="text-sm text-slate-500">Tidak ada jadwal mengajar hari ini.</p>
            </CardContent>
         </Card>
         <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
               <CardTitle className="text-base font-bold text-slate-800">Progress Input Nilai</CardTitle>
               <CardDescription className="text-xs text-slate-500">Semester Ganjil 2024/2025</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
               <p className="text-sm text-slate-500 text-center">Periode input nilai belum dibuka.</p>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
