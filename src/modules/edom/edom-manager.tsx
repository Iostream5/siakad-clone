"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function EdomManager({ questionnaires }: { questionnaires: any[] }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-tight">Manajemen EDOM</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500">Kelola kuesioner Evaluasi Dosen Oleh Mahasiswa.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {questionnaires.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Belum ada kuesioner aktif.</p>
          ) : (
            questionnaires.map((q) => (
              <div key={q.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-lg">
                <div>
                  <h4 className="font-bold text-slate-800">{q.judul}</h4>
                  <p className="text-xs text-slate-500">{q.deskripsi}</p>
                </div>
                <Badge variant={q.is_active ? "default" : "secondary"}>
                  {q.is_active ? "Aktif" : "Non-aktif"}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
