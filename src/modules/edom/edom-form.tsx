"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function EdomForm({ eligibleClasses }: { eligibleClasses: any[] }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-tight">Kelas Evaluasi Anda</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500">Berikan penilaian objektif untuk dosen pengampu kelas Anda. Identitas Anda dirahasiakan.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {!eligibleClasses || eligibleClasses.length === 0 ? (
             <div className="p-8 text-center text-slate-500 text-sm">
               Belum ada evaluasi kelas yang perlu diisi saat ini.
             </div>
          ) : (
             eligibleClasses.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                   <div>
                      <h4 className="font-bold text-slate-800 text-sm">{item.mataKuliah} <span className="text-slate-400 font-medium">({item.kelas})</span></h4>
                      <p className="text-xs text-slate-500 mt-1">Dosen: {item.dosen}</p>
                   </div>
                   <div>
                     {item.isSubmitted ? (
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">Selesai</Badge>
                     ) : (
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Isi Evaluasi</Button>
                     )}
                   </div>
                </div>
             ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
