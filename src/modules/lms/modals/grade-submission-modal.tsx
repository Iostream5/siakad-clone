"use client";

import { useTransition } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { gradeSubmissionAction } from "@/actions/lms";
import { useToast } from "@/components/ui/toast-provider";
import { ExternalLink, User } from "lucide-react";

interface GradeSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any;
  maxPoints: number;
}

export function GradeSubmissionModal({ isOpen, onClose, submission, maxPoints }: GradeSubmissionModalProps) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  if (!submission) return null;

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await gradeSubmissionAction(formData);
      if (result.success) {
        success("Nilai berhasil disimpan");
        onClose();
      } else {
        error(result.error || "Gagal menyimpan nilai");
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-[1.5rem] border-none shadow-2xl">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Penilaian Tugas Mahasiswa</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
             <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
               <User className="h-6 w-6" />
             </div>
             <div>
               <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{submission.mahasiswa?.users?.full_name}</p>
               <p className="text-xs font-bold text-slate-500">{submission.mahasiswa?.nim}</p>
             </div>
          </div>

          <div className="space-y-3">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Jawaban / Konten Teks</p>
             <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 min-h-[100px] whitespace-pre-wrap">
               {submission.konten_teks || <span className="italic text-slate-400">Tidak ada teks jawaban.</span>}
             </div>
          </div>

          {submission.file_url && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50 border border-indigo-100">
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Lampiran Jawaban</p>
                 <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-700 hover:underline flex items-center gap-1 mt-1">
                   Buka File / Link <ExternalLink className="h-3 w-3" />
                 </a>
               </div>
            </div>
          )}

          <form action={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100">
            <input type="hidden" name="submissionId" value={submission.id} />
            
            <div className="space-y-2">
              <Label htmlFor="nilai" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Beri Nilai (Maks: {maxPoints})</Label>
              <Input 
                id="nilai" 
                name="nilai" 
                type="number"
                min="0"
                max={maxPoints}
                defaultValue={submission.nilai ?? ""}
                required 
                className="h-14 rounded-xl border-slate-200 focus:border-indigo-500 font-black text-lg w-full max-w-[200px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="umpanBalik" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Umpan Balik (Opsional)</Label>
              <Textarea 
                id="umpanBalik" 
                name="umpanBalik" 
                defaultValue={submission.umpan_balik ?? ""}
                placeholder="Berikan catatan perbaikan atau apresiasi..." 
                className="rounded-xl border-slate-200 focus:border-indigo-500 font-medium min-h-[100px]"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose}
                className="font-bold text-xs uppercase tracking-widest h-12 rounded-xl"
              >
                Tutup
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl shadow-lg shadow-indigo-100"
              >
                {isPending ? "Menyimpan..." : "Simpan Nilai"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
