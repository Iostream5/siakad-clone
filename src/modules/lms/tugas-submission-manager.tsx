"use client";

import { useState, useTransition } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  Send, 
  CheckCircle2,
  AlertCircle,
  Paperclip,
  GraduationCap
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitLmsTugasAction } from "@/actions/lms";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";

interface TugasSubmissionManagerProps {
  user: any;
  tugas: any;
  studentProfile: any;
  initialSubmission: any;
}

export function TugasSubmissionManager({ 
  user, 
  tugas, 
  studentProfile, 
  initialSubmission 
}: TugasSubmissionManagerProps) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();
  const router = useRouter();

  const isExpired = new Date(tugas.deadline) < new Date();
  const hasSubmitted = !!initialSubmission;
  const isStudent = user.role === "Mahasiswa";

  async function handleSubmit(formData: FormData) {
    if (!studentProfile) return;
    
    startTransition(async () => {
      const result = await submitLmsTugasAction(formData);
      if (result.success) {
        success("Tugas berhasil dikumpulkan");
        router.refresh();
      } else {
        error(result.error || "Gagal mengumpulkan tugas");
      }
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/akademik/lms/${tugas.jadwal_id}`}>
          <Button variant="ghost" className="text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-white/50">
            <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Kelas
          </Button>
        </Link>
        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-[10px] uppercase tracking-wider px-3">
          Tugas Individu
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Detail Tugas */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-slate-200 shadow-xl rounded-[2rem] bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <FileText className="h-40 w-40" />
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <Badge className={cn(
                  "font-black text-[10px] uppercase tracking-widest px-2.5 h-6",
                  isExpired ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                )}>
                  {isExpired ? 'Deadline Terlewati' : 'Sedang Berjalan'}
                </Badge>
                <div className="flex items-center text-slate-400 gap-1.5 text-[10px] font-black uppercase tracking-widest">
                  <Clock className="h-3.5 w-3.5" /> Deadline: {new Date(tugas.deadline).toLocaleString('id-ID')}
                </div>
              </div>

              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-tight mb-4">{tugas.judul}</h1>
              
              <div className="flex items-center gap-6 py-4 border-y border-slate-100 mb-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mata Kuliah</p>
                  <p className="text-sm font-bold text-slate-700">{tugas.jadwal?.mata_kuliah?.nama}</p>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bobot</p>
                  <p className="text-sm font-black text-emerald-600">{tugas.poin_max} Poin</p>
                </div>
              </div>

              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                  {tugas.instruksi || 'Tidak ada instruksi tambahan.'}
                </p>
              </div>

              {tugas.file_url && (
                <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                      <Paperclip className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-tight">Lampiran Soal</p>
                      <p className="text-[10px] text-slate-400 font-medium">Klik untuk mendownload file pendukung</p>
                    </div>
                  </div>
                  <a href={tugas.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 font-bold text-xs h-9 px-4 rounded-lg shadow-sm transition-colors">
                    Unduh File
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Submission Status/Form */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-xl rounded-[2.5rem] overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
            <div className="p-8">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">Status Pengumpulan</h3>
              
              {!hasSubmitted ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-tight leading-normal">Tugas Belum Dikumpulkan</p>
                  </div>
                  
                  {isStudent && !isExpired && (
                    <form action={handleSubmit} className="space-y-4">
                      <input type="hidden" name="tugasId" value={tugas.id} />
                      <input type="hidden" name="mahasiswaId" value={studentProfile?.id} />
                      
                      <div className="space-y-2">
                        <Label htmlFor="kontenTeks" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Jawaban / Catatan</Label>
                        <Textarea 
                          id="kontenTeks" 
                          name="kontenTeks" 
                          placeholder="Tuliskan jawaban singkat atau catatan untuk dosen..." 
                          className="rounded-2xl border-slate-200 focus:border-indigo-500 font-medium min-h-[120px] bg-white shadow-inner"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fileUrl" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Link Tugas (Drive/Lainnya)</Label>
                        <Input 
                          id="fileUrl" 
                          name="fileUrl" 
                          placeholder="https://link-tugas-anda.com" 
                          className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 font-medium bg-white"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={isPending}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs h-14 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95"
                      >
                        {isPending ? "Mengirim..." : "Kumpulkan Tugas Sekarang"} <Send className="h-4 w-4 ml-2" />
                      </Button>
                    </form>
                  )}

                  {isExpired && !hasSubmitted && (
                    <div className="text-center py-6">
                      <p className="text-sm font-bold text-rose-500 uppercase tracking-widest">Waktu pengumpulan telah berakhir.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col items-center text-center p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100 text-emerald-700">
                    <div className="h-16 w-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-200 animate-bounce">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-widest">Tugas Berhasil Terkirim</p>
                    <p className="text-[10px] font-bold text-emerald-600/70 mt-1">Dikirim pada {new Date(initialSubmission.submitted_at).toLocaleString('id-ID')}</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-white border border-slate-100 space-y-4 shadow-sm">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Poin Diperoleh</p>
                      <p className="text-2xl font-black text-slate-900">{initialSubmission.nilai ?? '--'} <span className="text-slate-300 text-sm">/ {tugas.poin_max}</span></p>
                    </div>
                    
                    {initialSubmission.umpan_balik && (
                      <div className="pt-4 border-t border-slate-50">
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2">Umpan Balik Dosen</p>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed italic">"{initialSubmission.umpan_balik}"</p>
                      </div>
                    )}
                  </div>

                  {isStudent && !isExpired && (
                    <Button variant="outline" className="w-full border-slate-200 font-bold text-xs h-12 rounded-xl text-slate-500 hover:bg-slate-50">
                      Edit Pengumpulan
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 border-slate-200 shadow-lg rounded-[2rem] bg-indigo-600 text-white overflow-hidden relative">
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <GraduationCap className="h-24 w-24" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-indigo-200">Tips Akademik</p>
            <p className="text-sm font-bold leading-relaxed relative z-10">
              Pastikan link tugas Anda dapat diakses secara publik atau berikan akses kepada dosen pengampu sebelum mengumpulkan.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
