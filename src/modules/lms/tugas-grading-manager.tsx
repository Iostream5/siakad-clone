"use client";

import { useState, useTransition } from "react";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  FileText, 
  MoreVertical, 
  Search, 
  User,
  ExternalLink,
  ClipboardCheck,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { GradeSubmissionModal } from "./modals/grade-submission-modal";
import { cn } from "@/lib/utils";

interface TugasGradingManagerProps {
  user: any;
  tugas: any;
  initialSubmissions: any[];
}

export function TugasGradingManager({ user, tugas, initialSubmissions }: TugasGradingManagerProps) {
  const [search, setSearch] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  const filtered = initialSubmissions.filter(s => 
    s.mahasiswa?.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.mahasiswa?.nim?.toLowerCase().includes(search.toLowerCase())
  );

  const gradedCount = initialSubmissions.filter(s => s.nilai !== null).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/akademik/lms/${tugas.jadwal_id}`}>
          <Button variant="ghost" className="text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-white/50">
            <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Kelas
          </Button>
        </Link>
        <div className="flex gap-2">
           <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[10px] uppercase tracking-wider px-3">
             {gradedCount} / {initialSubmissions.length} Dinilai
           </Badge>
        </div>
      </div>

      {/* Assignment Info Header */}
      <Card className="p-8 border-slate-200 shadow-xl rounded-[2rem] bg-white overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
             <p className="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Penilaian Tugas</p>
             <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-tight mb-2">{tugas.judul}</h1>
             <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Deadline: {new Date(tugas.deadline).toLocaleString('id-ID')}</span>
                <span className="h-1 w-1 bg-slate-200 rounded-full" />
                <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Max {tugas.poin_max} Poin</span>
             </div>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest h-12 px-6">
                Download Semua
             </Button>
             <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-xs h-12 px-8 shadow-lg shadow-indigo-100">
                Publish Nilai
             </Button>
          </div>
        </div>
      </Card>

      {/* Submissions List */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 p-2 rounded-[1.5rem] border border-slate-200/60 backdrop-blur-sm">
           <div className="flex items-center gap-3 px-4 py-2">
             <div className="h-8 w-1.5 bg-indigo-600 rounded-full" />
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Daftar Pengumpulan</h3>
           </div>
           <div className="relative max-w-sm w-full">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
             <Input 
                placeholder="Cari Mahasiswa..." 
                className="pl-10 h-11 bg-white border-slate-200 rounded-xl font-bold text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
           </div>
        </div>

        <Card className="border-slate-200 shadow-xl rounded-[2rem] overflow-hidden bg-white">
          <Table>
            <THead className="bg-slate-50/50">
              <TR>
                <TH className="w-16">#</TH>
                <TH>Mahasiswa</TH>
                <TH>Waktu Kirim</TH>
                <TH>Link Tugas</TH>
                <TH>Status</TH>
                <TH className="text-center">Nilai</TH>
                <TH className="text-right">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="py-20 text-center">
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Belum ada pengumpulan.</p>
                  </TD>
                </TR>
              ) : (
                filtered.map((item, idx) => {
                  const isLate = new Date(item.submitted_at) > new Date(tugas.deadline);
                  const isGraded = item.nilai !== null;

                  return (
                    <TR key={item.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedSubmission(item)}>
                      <TD className="text-slate-400 font-bold text-xs">{idx + 1}</TD>
                      <TD>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100">
                             <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 uppercase leading-none mb-1">{item.mahasiswa?.users?.full_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest">{item.mahasiswa?.nim}</p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <p className="text-xs font-bold text-slate-700">{new Date(item.submitted_at).toLocaleString('id-ID')}</p>
                        {isLate && <Badge className="mt-1 bg-rose-50 text-rose-600 border-rose-100 font-black text-[8px] uppercase tracking-tighter h-4">Terlambat</Badge>}
                      </TD>
                      <TD>
                        {item.file_url ? (
                          <a 
                            href={item.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1.5 text-indigo-600 font-black text-[10px] uppercase hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" /> Buka Link
                          </a>
                        ) : <span className="text-slate-300 font-bold text-[10px]">TIDAK ADA</span>}
                      </TD>
                      <TD>
                        {isGraded ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[9px] uppercase tracking-widest h-6 px-2">Dinilai</Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-black text-[9px] uppercase tracking-widest h-6 px-2">Menunggu</Badge>
                        )}
                      </TD>
                      <TD className="text-center">
                        <span className={cn(
                          "text-base font-black px-3 py-1 rounded-lg",
                          isGraded ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
                        )}>
                          {item.nilai ?? '--'}
                        </span>
                      </TD>
                      <TD className="text-right">
                        <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[9px] h-9 px-4 rounded-lg">
                           Beri Nilai
                        </Button>
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </Card>
      </div>

      <GradeSubmissionModal 
        isOpen={!!selectedSubmission} 
        onClose={() => setSelectedSubmission(null)} 
        submission={selectedSubmission}
        maxPoints={tugas.poin_max}
      />
    </div>
  );
}
