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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { createLmsMateriAction } from "@/actions/lms";
import { useToast } from "@/components/ui/toast-provider";

interface AddMateriModalProps {
  isOpen: boolean;
  onClose: () => void;
  jadwalId: string;
}

export function AddMateriModal({ isOpen, onClose, jadwalId }: AddMateriModalProps) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createLmsMateriAction(formData);
      if (result.success) {
        success("Materi berhasil diunggah");
        onClose();
      } else {
        error(result.error || "Gagal mengunggah materi");
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[1.5rem] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Upload Materi Kuliah</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 py-4">
          <input type="hidden" name="jadwalId" value={jadwalId} />
          
          <div className="space-y-2">
            <Label htmlFor="judul" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Judul Materi</Label>
            <Input 
              id="judul" 
              name="judul" 
              placeholder="Contoh: Pertemuan 1 - Pengenalan Basis Data" 
              required 
              className="h-12 rounded-xl border-slate-200 focus:border-emerald-500 font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Deskripsi / Instruksi</Label>
            <Textarea 
              id="deskripsi" 
              name="deskripsi" 
              placeholder="Berikan ringkasan materi atau instruksi bacaan..." 
              className="rounded-xl border-slate-200 focus:border-emerald-500 font-medium min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fileType" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipe Konten</Label>
              <Select name="fileType" defaultValue="pdf">
                <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold">
                  <SelectValue placeholder="Pilih Tipe" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="video">Video Learning</SelectItem>
                  <SelectItem value="link">External Link</SelectItem>
                  <SelectItem value="doc">Word / Document</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fileUrl" className="text-[10px] font-black uppercase tracking-widest text-slate-500">URL File / Link</Label>
              <Input 
                id="fileUrl" 
                name="fileUrl" 
                placeholder="https://..." 
                className="h-12 rounded-xl border-slate-200 focus:border-emerald-500 font-medium"
              />
            </div>
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl shadow-lg shadow-emerald-100"
            >
              {isPending ? "Mengunggah..." : "Simpan Materi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
