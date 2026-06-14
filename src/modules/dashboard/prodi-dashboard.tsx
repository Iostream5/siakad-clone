"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function ProdiDashboard({ user, stats }: { user: any, stats: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-100">Total Mahasiswa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">1,245</div>
            <p className="text-xs text-indigo-200 mt-1">Status Aktif</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">KRS Perlu Approve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-600">86</div>
            <p className="text-xs text-slate-500 mt-1">Persetujuan Prodi</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Kelas Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">42</div>
            <p className="text-xs text-slate-500 mt-1">Semester ini</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Dosen Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">38</div>
            <p className="text-xs text-slate-500 mt-1">Mengajar semester ini</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
               <CardTitle className="text-base font-bold text-slate-800">Distribusi IPK Mahasiswa</CardTitle>
               <CardDescription className="text-xs text-slate-500">Semester sebelumnya</CardDescription>
            </CardHeader>
            <CardContent className="p-6 h-48 flex items-center justify-center">
               <p className="text-sm text-slate-500">Grafik distribusi IPK</p>
            </CardContent>
         </Card>
         <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
               <CardTitle className="text-base font-bold text-slate-800">Progress Nilai Dosen</CardTitle>
               <CardDescription className="text-xs text-slate-500">Persentase input nilai ke sistem</CardDescription>
            </CardHeader>
            <CardContent className="p-6 h-48 flex items-center justify-center">
               <p className="text-sm text-slate-500">Grafik progress input nilai</p>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
