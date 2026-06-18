"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export function EdomResults({ results }: { results?: any[] }) {
  // Aggregate basic average rating if there is data
  let totalRating = 0;
  let countRating = 0;
  let summaryByLecturer: Record<string, { total: number, count: number, name: string }> = {};

  if (results && results.length > 0) {
     results.forEach(res => {
        const lecturer = res.jadwal_kuliah?.dosen?.users?.full_name || "Unknown";
        if (!summaryByLecturer[lecturer]) summaryByLecturer[lecturer] = { total: 0, count: 0, name: lecturer };

        res.edom_response_answers?.forEach((ans: any) => {
           if (ans.nilai_rating) {
              totalRating += ans.nilai_rating;
              countRating++;
              summaryByLecturer[lecturer].total += ans.nilai_rating;
              summaryByLecturer[lecturer].count++;
           }
        });
     });
  }

  const overallAvg = countRating > 0 ? (totalRating / countRating).toFixed(2) : "0.00";

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-tight">Hasil Evaluasi Global</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500">Rekapitulasi nilai rata-rata Evaluasi Dosen.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {(!results || results.length === 0) ? (
          <p className="text-sm text-slate-500 text-center py-8">Hasil evaluasi belum tersedia.</p>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                 <BarChart3 className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata Keseluruhan</p>
                  <p className="text-2xl font-black text-slate-900">{overallAvg} <span className="text-sm text-slate-400 font-medium">/ 5.00</span></p>
               </div>
            </div>

            <div>
               <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-tight">Rata-rata Per Dosen</h4>
               <div className="space-y-3">
                 {Object.values(summaryByLecturer).map((sum, i) => {
                    const avg = sum.count > 0 ? (sum.total / sum.count).toFixed(2) : "0.00";
                    return (
                       <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                          <p className="text-sm font-bold text-slate-700">{sum.name}</p>
                          <div className="text-right">
                             <p className="text-sm font-bold text-indigo-600">{avg}</p>
                             <p className="text-[10px] text-slate-400 uppercase font-bold">{sum.count} Penilaian</p>
                          </div>
                       </div>
                    );
                 })}
               </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
