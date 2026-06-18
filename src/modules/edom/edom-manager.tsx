"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ListTodo } from "lucide-react";

export function EdomManager({ questionnaires }: { questionnaires: any[] }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-tight">Manajemen Kuesioner</CardTitle>
          <CardDescription className="text-sm font-medium text-slate-500">Kelola kuesioner Evaluasi Dosen Oleh Mahasiswa.</CardDescription>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Buat Kuesioner
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {questionnaires.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <ListTodo className="w-8 h-8 mx-auto mb-3 text-slate-300" />
              <p>Belum ada kuesioner EDOM yang tersedia.</p>
            </div>
          ) : (
            questionnaires.map((q) => (
              <div key={q.id} className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{q.judul}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{q.deskripsi || "Tidak ada deskripsi"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {q.edom_questions?.length || 0} Pertanyaan
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      TA: {q.tahun_akademik?.nama || "-"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={q.is_active ? "default" : "secondary"} className={q.is_active ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none" : ""}>
                    {q.is_active ? "Aktif" : "Non-aktif"}
                  </Badge>
                  <Button variant="outline" size="sm" className="text-xs h-8">Lihat Soal</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
