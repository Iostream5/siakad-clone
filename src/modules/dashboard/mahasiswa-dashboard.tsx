"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MahasiswaDashboard({ user, stats }: { user: any, stats: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-100">IPK Saat Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">3.75</div>
            <p className="text-xs text-indigo-200 mt-1">Sangat Memuaskan</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">SKS Diambil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">114</div>
            <p className="text-xs text-slate-500 mt-1">Total SKS kumulatif</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tagihan Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-600">Rp 0</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">✓ Lunas semester ini</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tugas LMS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">2</div>
            <p className="text-xs text-slate-500 mt-1">Mendekati deadline</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
               <CardTitle className="text-base font-bold text-slate-800">Jadwal Kuliah Hari Ini</CardTitle>
               <CardDescription className="text-xs text-slate-500">Daftar kelas yang harus Anda hadiri hari ini.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-center">
               <p className="text-sm text-slate-500">Tidak ada jadwal kuliah hari ini.</p>
            </CardContent>
         </Card>
         <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
               <CardTitle className="text-base font-bold text-slate-800">Status KRS</CardTitle>
               <CardDescription className="text-xs text-slate-500">Semester Ganjil 2024/2025</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
               <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-slate-700">Status</span>
                  <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Disetujui</Badge>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">SKS Diambil</span>
                  <span className="text-sm font-black text-slate-900">24 SKS</span>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
