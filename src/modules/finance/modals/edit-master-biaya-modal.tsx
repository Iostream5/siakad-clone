"use client";

import { useFormStatus } from "react-dom";
import { Calculator } from "lucide-react";

import { updateMasterBiayaAction } from "@/actions/finance-master";
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
import { Textarea } from "@/components/ui/textarea";

type AcademicYearOption = {
  id: string;
  nama: string;
};

type StudyProgramOption = {
  id: string;
  nama: string;
};

type EditMasterBiayaModalProps = {
  editData: any;
  open: boolean;
  onClose: () => void;
  tahunAkademikList: AcademicYearOption[];
  prodiList: StudyProgramOption[];
};

const semesterOptions = ["1", "2", "3", "4", "5", "6", "7", "8"];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 rounded-none bg-emerald-600 px-6 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700"
    >
      {pending ? "Menyimpan..." : "Simpan Tarif"}
    </Button>
  );
}

export default function EditMasterBiayaModal({ open, onClose, editData, tahunAkademikList, prodiList }: EditMasterBiayaModalProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onClose();
    }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-none bg-white shadow-2xl sm:max-w-3xl">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-none bg-emerald-600 text-white">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black uppercase tracking-tight text-slate-900">Edit Tarif Kuliah</DialogTitle>
              <DialogDescription className="mt-1 text-xs font-semibold text-slate-500">
                Perbarui data tarif kuliah ini.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form action={updateMasterBiayaAction} className="grid gap-5 py-2" onSubmit={onClose}>
          <input type="hidden" name="id" value={editData?.id || ""} />
          <input type="hidden" name="status" value="on" />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="nama" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nama Tarif</Label>
              <Input id="nama" name="nama" defaultValue={editData?.nama || ""} placeholder="SPP Semester Genap" required className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nominal" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nominal</Label>
              <Input id="nominal" name="nominal" type="number" defaultValue={editData?.nominal || ""} min={1} step={1000} placeholder="3000000" required className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="tahunAkademikId" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tahun Akademik</Label>
              <select
                id="tahunAkademikId"
                name="tahunAkademikId"
                defaultValue={editData?.tahun_akademik_id || editData?.tahun_akademik?.id || ""}
                className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="">Semua tahun</option>
                {tahunAkademikList.map((tahun) => (
                  <option key={tahun.id} value={tahun.id}>{tahun.nama}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="prodiId" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Program Studi</Label>
              <select
                id="prodiId"
                name="prodiId"
                defaultValue={editData?.prodi_id || editData?.program_studi?.id || ""}
                className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="">Seluruh prodi</option>
                {prodiList.map((prodi) => (
                  <option key={prodi.id} value={prodi.id}>{prodi.nama}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="angkatan" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Angkatan</Label>
              <Input id="angkatan" name="angkatan" type="number" defaultValue={editData?.angkatan || ""} min={2000} max={2100} placeholder="2026" className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Semester Target</Label>
            <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
              {semesterOptions.map((semester) => (
                <label key={semester} className="flex h-10 items-center justify-center gap-2 rounded-none border-2 border-slate-100 bg-slate-50 text-xs font-black text-slate-600">
                  <input type="checkbox" name="tingkat_kelas" value={semester} className="accent-emerald-600" />
                  {semester}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="gelombang" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gelombang</Label>
              <Input id="gelombang" name="gelombang" placeholder="Semua" className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="jalur" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Jalur</Label>
              <Input id="jalur" name="jalur" placeholder="Reguler" className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="terbit" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Terbit</Label>
              <select id="terbit" name="terbit" className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white">
                <option value="Sekali">Sekali</option>
                <option value="Rutin">Rutin</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="keterangan" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Keterangan</Label>
            <Textarea id="keterangan" name="keterangan" placeholder="Catatan tarif bila diperlukan" className="min-h-24 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
          </div>

          <label className="flex items-center gap-3 rounded-none border border-slate-100 bg-slate-50 p-3 text-xs font-bold text-slate-600">
            <input type="checkbox" name="boleh_angsur" className="accent-emerald-600" />
            Boleh diangsur
          </label>

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
