"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Pencil, Plus, Search, Trash2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { saveJadwalKuliahAction, deleteJadwalKuliahAction } from "@/actions/jadwal-kuliah";
import { useToast } from "@/components/ui/toast-provider";
import { JadwalKuliahRow } from "@/lib/admin/jadwal-kuliah";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

function ModalShell({ isOpen, onClose, title, children }: any) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function JadwalKuliahFormModal({
  open,
  onClose,
  item,
  tahunAkademikList,
  mataKuliahList,
  dosenList,
}: {
  open: boolean;
  onClose: () => void;
  item: JadwalKuliahRow | null;
  tahunAkademikList: any[];
  mataKuliahList: any[];
  dosenList: any[];
}) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveJadwalKuliahAction(formData);
      if (result.success) {
        success(item ? "Jadwal berhasil diperbarui" : "Jadwal berhasil ditambahkan");
        onClose();
      } else {
        error(result.error || "Terjadi kesalahan");
      }
    });
  }

  if (!open) return null;

  return (
    <ModalShell isOpen={open} onClose={onClose} title={item ? "Edit Jadwal Kuliah" : "Tambah Jadwal Kuliah"}>
      <form action={handleSubmit} className="space-y-4 pt-4">
        {item && <input type="hidden" name="id" value={item.id} />}

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase">Tahun Akademik</label>
          <select name="tahunAkademikId" defaultValue={item?.tahun_akademik?.id || ""} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm" required>
            <option value="">Pilih Tahun Akademik</option>
            {tahunAkademikList.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase">Mata Kuliah</label>
          <select name="mataKuliahId" defaultValue={item?.mata_kuliah?.id || ""} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm" required>
            <option value="">Pilih Mata Kuliah</option>
            {mataKuliahList.map((m) => <option key={m.id} value={m.id}>{m.kode} - {m.nama}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase">Dosen Pengampu</label>
          <select name="dosenId" defaultValue={item?.dosen?.id || ""} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm" required>
            <option value="">Pilih Dosen</option>
            {dosenList.map((d) => <option key={d.id} value={d.id}>{d.users?.full_name || "Tanpa Nama"}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Nama Kelas</label>
            <Input name="namaKelas" defaultValue={item?.nama_kelas} placeholder="Contoh: TI-1A" required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Hari</label>
            <select name="hari" defaultValue={item?.hari || "Senin"} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm" required>
              {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Jam Mulai</label>
            <Input name="jamMulai" type="time" defaultValue={item?.jam_mulai?.substring(0, 5)} required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Jam Selesai</label>
            <Input name="jamSelesai" type="time" defaultValue={item?.jam_selesai?.substring(0, 5)} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Ruangan</label>
            <Input name="ruangan" defaultValue={item?.ruangan} placeholder="Contoh: R. 101" required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Kapasitas</label>
            <Input name="kapasitas" type="number" min="1" defaultValue={item?.kapasitas || 40} required />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={isPending}>{isPending ? "Menyimpan..." : "Simpan"}</Button>
        </div>
      </form>
    </ModalShell>
  );
}

function DeleteJadwalKuliahModal({ open, onClose, item }: { open: boolean; onClose: () => void; item: JadwalKuliahRow | null }) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  if (!item) return null;

  async function handleDelete(formData: FormData) {
    startTransition(async () => {
      const result = await deleteJadwalKuliahAction(formData);
      if (result.success) {
        success("Jadwal kuliah berhasil dihapus");
        onClose();
      } else {
        error(result.error || "Terjadi kesalahan");
      }
    });
  }

  return (
    <ModalShell isOpen={open} onClose={onClose} title="Hapus Jadwal Kuliah">
      <div className="py-4">
        <p className="text-sm text-slate-600">Apakah Anda yakin ingin menghapus jadwal <strong>{item.mata_kuliah.nama} ({item.nama_kelas})</strong>?</p>
      </div>
      <form action={handleDelete} className="flex justify-end gap-2 pt-4">
        <input type="hidden" name="id" value={item.id} />
        <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
        <Button type="submit" disabled={isPending} className="bg-rose-600 hover:bg-rose-700 text-white">
          {isPending ? "Menghapus..." : "Ya, Hapus"}
        </Button>
      </form>
    </ModalShell>
  );
}

export function JadwalKuliahManager({
  items,

  query,
  tahunAkademikList,
  mataKuliahList,
  dosenList,
}: any) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(query);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JadwalKuliahRow | null>(null);
  const [deletingItem, setDeletingItem] = useState<JadwalKuliahRow | null>(null);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) params.set("q", search.trim());
    else params.delete("q");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-white/60 bg-white/80 backdrop-blur-md shadow-xl shadow-slate-200/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Jadwal Kuliah</h3>
              <p className="text-sm text-slate-500">Manajemen jadwal kelas, dosen, dan waktu perkuliahan.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setEditingItem(null); setFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Jadwal
            </Button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 p-4 pt-0">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama kelas atau ruangan..." className="pl-10" />
          </div>
          <Button type="submit">Cari</Button>
          <Link href={pathname}><Button type="button" variant="secondary">Reset</Button></Link>
        </form>

        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Tahun Akademik</TH>
                <TH>Mata Kuliah</TH>
                <TH>Dosen</TH>
                <TH>Kelas & Waktu</TH>
                <TH>Ruangan & Kapasitas</TH>
                <TH className="w-24">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {items.length === 0 ? (
                <TR><TD colSpan={6} className="py-10 text-center text-slate-500">Data jadwal kuliah kosong</TD></TR>
              ) : items.map((item: any) => (
                <TR key={item.id}>
                  <TD className="text-sm text-slate-600 font-medium">{item.tahun_akademik?.nama}</TD>
                  <TD>
                    <p className="font-semibold text-slate-900">{item.mata_kuliah?.nama}</p>
                    <p className="text-xs text-slate-500">{item.mata_kuliah?.kode}</p>
                  </TD>
                  <TD className="text-sm font-medium text-slate-700">{item.dosen?.users?.full_name}</TD>
                  <TD>
                    <p className="font-bold text-slate-900">{item.nama_kelas}</p>
                    <p className="text-xs text-slate-500">{item.hari}, {item.jam_mulai?.substring(0, 5)} - {item.jam_selesai?.substring(0, 5)}</p>
                  </TD>
                  <TD>
                    <p className="font-semibold text-slate-900">{item.ruangan}</p>
                    <p className="text-xs text-slate-500">{item.peserta} / {item.kapasitas} Peserta</p>
                  </TD>
                  <TD>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => { setEditingItem(item); setFormOpen(true); }} className="h-11 w-11 sm:h-8 sm:w-8 p-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeletingItem(item)} className="h-11 w-11 sm:h-8 sm:w-8 p-0 text-rose-600 hover:bg-rose-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>

      <JadwalKuliahFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        item={editingItem}
        tahunAkademikList={tahunAkademikList}
        mataKuliahList={mataKuliahList}
        dosenList={dosenList}
      />
      <DeleteJadwalKuliahModal open={Boolean(deletingItem)} onClose={() => setDeletingItem(null)} item={deletingItem} />
    </div>
  );
}