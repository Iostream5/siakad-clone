"use client";

import { useFormStatus } from "react-dom";
import { ReceiptText } from "lucide-react";

import { createTagihanAction } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MahasiswaRow } from "@/lib/admin/mahasiswa";

type AcademicYearOption = {
  id: string;
  nama: string;
};

type AddTagihanModalProps = {
  open: boolean;
  onClose: () => void;
  mahasiswaList: MahasiswaRow[];
  tahunAkademikList: AcademicYearOption[];
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 rounded-none bg-emerald-600 px-6 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700"
    >
      {pending ? "Menyimpan..." : "Simpan Tagihan"}
    </Button>
  );
}

export default function AddTagihanModal({ open, onClose, mahasiswaList, tahunAkademikList }: AddTagihanModalProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onClose();
    }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-none bg-white shadow-2xl sm:max-w-2xl">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-none bg-emerald-600 text-white">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black uppercase tracking-tight text-slate-900">Buat Tagihan Baru</DialogTitle>
              <DialogDescription className="mt-1 text-xs font-semibold text-slate-500">
                Buat invoice manual untuk mahasiswa terpilih.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form action={createTagihanAction} className="grid gap-5 py-2" onSubmit={onClose}>
          <div className="grid gap-2">
            <Label htmlFor="mahasiswaId" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mahasiswa</Label>
            <select
              id="mahasiswaId"
              name="mahasiswaId"
              required
              className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
            >
              <option value="">Pilih mahasiswa</option>
              {mahasiswaList.map((mahasiswa) => (
                <option key={mahasiswa.id} value={mahasiswa.id}>
                  {mahasiswa.nim ?? "-"} - {mahasiswa.users?.full_name ?? "Tanpa nama"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="tahunAkademikId" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tahun Akademik</Label>
              <select
                id="tahunAkademikId"
                name="tahunAkademikId"
                required
                className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="">Pilih tahun akademik</option>
                {tahunAkademikList.map((tahun) => (
                  <option key={tahun.id} value={tahun.id}>{tahun.nama}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="jatuhTempo" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Jatuh Tempo</Label>
              <Input id="jatuhTempo" name="jatuhTempo" type="date" required className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="jenis" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nama Tagihan</Label>
              <Input id="jenis" name="jenis" placeholder="SPP Semester Genap" required className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nominal" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nominal</Label>
              <Input id="nominal" name="nominal" type="number" min={1} step={1000} placeholder="3000000" required className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="h-11 rounded-none px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Batal
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
