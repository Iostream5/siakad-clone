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
import { createLmsTugasAction } from "@/actions/lms";
import { useToast } from "@/components/ui/toast-provider";

interface AddTugasModalProps {
  isOpen: boolean;
  onClose: () => void;
  jadwalId: string;
}

export function AddTugasModal({ isOpen, onClose, jadwalId }: AddTugasModalProps) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createLmsTugasAction(formData);
      if (result.success) {
        success("Tugas berhasil dipublish");
        onClose();
      } else {
        error(result.error || "Gagal membuat tugas");
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[1.5rem] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Buat Tugas Baru</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 py-4">
          <input type="hidden" name="jadwalId" value={jadwalId} />
          
          <div className="space-y-2">
            <Label htmlFor="judul" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Judul Tugas</Label>
            <Input 
              id="judul" 
              name="judul" 
              placeholder="Contoh: Laporan Analisis ERD" 
              required 
              className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instruksi" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Instruksi Tugas</Label>
            <Textarea 
              id="instruksi" 
              name="instruksi" 
              placeholder="Jelaskan detail tugas yang harus dikerjakan mahasiswa..." 
              className="rounded-xl border-slate-200 focus:border-indigo-500 font-medium min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Batas Waktu (Deadline)</Label>
              <Input 
                id="deadline" 
                name="deadline" 
                type="datetime-local" 
                required 
                className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 font-bold"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="poinMax" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Poin Maksimal</Label>
              <Input 
                id="poinMax" 
                name="poinMax" 
                type="number" 
                defaultValue="100"
                className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileUrl" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lampiran Soal (URL/Link)</Label>
            <Input 
              id="fileUrl" 
              name="fileUrl" 
              placeholder="https://google-drive.com/soal-tugas" 
              className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 font-medium"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="font-bold text-xs uppercase tracking-widest h-12 rounded-xl"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl shadow-lg shadow-indigo-100"
            >
              {isPending ? "Memproses..." : "Publish Tugas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
