"use client";

import { X } from "lucide-react";

import { updateTagihanAction } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type BillItem = {
  id: string;
  mahasiswa_id: string;
  tahun_akademik_id?: string;
  jenis: string;
  nominal: number | string;
  jatuh_tempo: string;
  status: string;
};

type StudentOption = {
  id: string;
  nim?: string | null;
  users?: {
    full_name?: string | null;
  } | null;
};

type AcademicYearOption = {
  id: string;
  nama: string;
};

type EditTagihanModalProps = {
  open: boolean;
  bill: BillItem | null;
  mahasiswaList: StudentOption[];
  tahunAkademikList: AcademicYearOption[];
  onClose: () => void;
};

export default function EditTagihanModal({ open, bill, mahasiswaList, tahunAkademikList, onClose }: EditTagihanModalProps) {
  if (!open || !bill) return null;

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md" onClick={onClose}>
      <Card className="w-full max-w-2xl overflow-hidden rounded-none border-none bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-5">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Edit Tagihan</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Jika sudah ada pembayaran, sistem hanya menerima perubahan jatuh tempo atau dispensasi.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-11 w-11 sm:h-9 sm:w-9 rounded-none text-slate-400">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form action={updateTagihanAction} className="grid gap-5 p-6" onSubmit={onClose}>
          <input type="hidden" name="id" value={bill.id} />
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Mahasiswa</label>
              <select name="mahasiswaId" defaultValue={bill.mahasiswa_id} required className="h-11 w-full rounded-none border-2 border-slate-100 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-emerald-500">
                {mahasiswaList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nim} - {item.users?.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Tahun Akademik</label>
              <select name="tahunAkademikId" defaultValue={bill.tahun_akademik_id} required className="h-11 w-full rounded-none border-2 border-slate-100 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-emerald-500">
                {tahunAkademikList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Jenis Tagihan</label>
              <Input name="jenis" defaultValue={bill.jenis} required className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Nominal</label>
              <Input name="nominal" type="number" min={1} step={1000} defaultValue={Number(bill.nominal)} required className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Jatuh Tempo</label>
              <Input name="jatuhTempo" type="date" defaultValue={bill.jatuh_tempo} required className="h-11 rounded-none border-2 border-slate-100 bg-slate-50 font-bold" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Status</label>
              <select name="status" defaultValue={bill.status} required className="h-11 w-full rounded-none border-2 border-slate-100 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-emerald-500">
                <option value="Belum Lunas">Belum Lunas</option>
                <option value="Lunas">Lunas</option>
                <option value="Dispensasi">Dispensasi</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Button type="button" variant="ghost" onClick={onClose} className="h-10 rounded-none text-[10px] font-black uppercase tracking-widest text-slate-500">
              Batal
            </Button>
            <Button type="submit" className="h-10 rounded-none bg-emerald-600 px-6 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
