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
import { createLmsForumTopikAction } from "@/actions/lms";
import { useToast } from "@/components/ui/toast-provider";
import { Checkbox } from "@/components/ui/checkbox";

interface AddForumModalProps {
  isOpen: boolean;
  onClose: () => void;
  jadwalId: string;
}

export function AddForumModal({ isOpen, onClose, jadwalId }: AddForumModalProps) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createLmsForumTopikAction(formData);
      if (result.success) {
        success("Topik diskusi berhasil dibuat");
        onClose();
      } else {
        error(result.error || "Gagal membuat topik diskusi");
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[1.5rem] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Buat Topik Diskusi Baru</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 py-4">
          <input type="hidden" name="jadwalId" value={jadwalId} />
          
          <div className="space-y-2">
            <Label htmlFor="judul" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Judul Topik</Label>
            <Input 
              id="judul" 
              name="judul" 
              placeholder="Contoh: Pertanyaan seputar ERD" 
              required 
              className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="konten" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Isi Diskusi</Label>
            <Textarea 
              id="konten" 
              name="konten" 
              placeholder="Tuliskan pertanyaan atau materi yang ingin didiskusikan..." 
              required
              className="rounded-xl border-slate-200 focus:border-indigo-500 font-medium min-h-[120px]"
            />
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <Checkbox id="isPinned" name="isPinned" value="true" />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="isPinned"
                className="text-xs font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700"
              >
                Sematkan Topik (Pin)
              </label>
              <p className="text-[10px] text-slate-400 font-medium">
                Topik akan selalu tampil di urutan paling atas.
              </p>
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl shadow-lg shadow-indigo-100"
            >
              {isPending ? "Memproses..." : "Mulai Diskusi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
