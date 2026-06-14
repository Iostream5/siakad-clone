"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function EdomForm() {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-tight">Form Evaluasi Dosen</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500">Berikan penilaian yang objektif. Identitas Anda dirahasiakan.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-sm text-slate-500 text-center py-8">Formulir evaluasi belum tersedia untuk diisi saat ini.</p>
      </CardContent>
    </Card>
  );
}
