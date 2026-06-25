"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Calendar, Pencil, Search, Trash2, X, RotateCcw, Save } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { deleteAcademicYearAction, saveAcademicYearAction } from "@/actions/academic-years";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AcademicYearRow } from "@/lib/admin/academic-years";
import { useActionToast } from "@/lib/use-action-toast";

const initialState = {
  success: false,
  message: null,
};

function buildPageLink(page: number, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `?${qs}` : "?";
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-100">
      {pending ? "Menyimpan..." : (
        <>
          <Save className="mr-2 h-4 w-4" />
          {children}
        </>
      )}
    </Button>
  );
}

function DeleteAcademicYearModal({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: AcademicYearRow | null;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(deleteAcademicYearAction as any, initialState);

  useActionToast(state, "Tahun akademik berhasil dihapus");

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [onClose, router, state?.success]);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-xl font-bold text-slate-900">Hapus Tahun Akademik</h3>
           <button onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-5 w-5 sm:h-6 sm:w-6" /></button>
        </div>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="id" value={item.id} />
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm text-rose-900">Hapus tahun akademik berikut?</p>
            <h4 className="mt-2 text-lg font-semibold text-slate-950">{item.nama}</h4>
            <p className="mt-1 text-sm text-slate-600">Seluruh data KRS dan nilai pada periode ini akan terdampak.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
              Hapus Permanen
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function AcademicYearsManager({
  items,
  totalItems,
  totalPages,
  currentPage,
  query,
}: {
  items: AcademicYearRow[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(query);
  const [editingItem, setEditingItem] = useState<AcademicYearRow | null>(null);
  const [deletingItem, setDeletingItem] = useState<AcademicYearRow | null>(null);

  const [formState, formAction] = useActionState(saveAcademicYearAction as any, initialState);
  useActionToast(formState, editingItem ? "Data diperbarui" : "Data ditambahkan");

  useEffect(() => {
    if (formState?.success) {
      queueMicrotask(() => setEditingItem(null));
      router.refresh();
    }
  }, [formState?.success, router]);

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
      <Card className="border-none bg-[linear-gradient(135deg,var(--primary),#0d9488)] p-6 shadow-lg shadow-cyan-900/10">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] backdrop-blur-md">
            <Calendar className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Tahun Akademik</h3>
            <p className="text-cyan-50/80 text-sm font-medium mt-0.5">Manajemen periode semester, pengaturan tanggal mulai, dan status pembukaan KRS</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        
        {/* KOLOM KIRI: FORM INPUT */}
        <div className="space-y-6">
          <Card className="sticky top-24 border-white/60 bg-white/80 backdrop-blur-md shadow-xl shadow-slate-200/50">
            <div className="p-6">
               <form action={formAction} className="space-y-4">
                  <input type="hidden" name="id" value={editingItem?.id ?? ""} />
                  
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Kode</label>
                        <Input name="kode" key={editingItem?.id || 'new-k'} defaultValue={editingItem?.kode} placeholder="20261" required />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Semester</label>
                        <select
                          name="semester"
                          key={editingItem?.id || 'new-s'}
                          defaultValue={editingItem?.semester ?? "Ganjil"}
                          className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 outline-none"
                        >
                          <option value="Ganjil">Ganjil</option>
                          <option value="Genap">Genap</option>
                          <option value="Antara">Antara</option>
                        </select>
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Nama Periode</label>
                     <Input name="nama" key={editingItem?.id || 'new-n'} defaultValue={editingItem?.nama} placeholder="2026/2027 Ganjil" required />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Tgl Mulai</label>
                        <Input name="tanggalMulai" type="date" key={editingItem?.id || 'new-tm'} defaultValue={editingItem?.tanggal_mulai ? new Date(editingItem.tanggal_mulai).toISOString().split('T')[0] : ""} required />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Tgl Selesai</label>
                        <Input name="tanggalSelesai" type="date" key={editingItem?.id || 'new-ts'} defaultValue={editingItem?.tanggal_selesai ? new Date(editingItem.tanggal_selesai).toISOString().split('T')[0] : ""} required />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50/50">
                        <input type="checkbox" name="isAktif" id="isAktif" defaultChecked={editingItem?.is_aktif ?? true} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                        <label htmlFor="isAktif" className="text-[11px] font-medium text-slate-700 cursor-pointer uppercase">Aktif</label>
                     </div>
                     <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50/50">
                        <input type="checkbox" name="isKrsOpen" id="isKrsOpen" defaultChecked={editingItem?.is_krs_open ?? false} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                        <label htmlFor="isKrsOpen" className="text-[11px] font-medium text-slate-700 cursor-pointer uppercase">Buka KRS</label>
                     </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                     <SubmitButton>{editingItem ? "Update Periode" : "Simpan Periode"}</SubmitButton>
                     {editingItem && (
                       <Button type="button" variant="secondary" onClick={() => setEditingItem(null)} className="w-full">
                          <RotateCcw className="mr-2 h-4 w-4" /> Batal Edit
                       </Button>
                     )}
                  </div>
               </form>
            </div>
          </Card>
        </div>

        {/* KOLOM KANAN: TABEL DATA */}
        <div className="flex-1 min-w-0">
          <Card className="overflow-hidden border-white/60 bg-white/80 backdrop-blur-md shadow-xl shadow-slate-200/50">
            <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <form onSubmit={handleSearchSubmit} className="relative max-w-sm flex-1">
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                 <Input 
                   placeholder="Cari periode..." 
                   className="pl-10 h-9 bg-white border-slate-200" 
                   value={search} 
                   onChange={(e) => setSearch(e.target.value)} 
                 />
              </form>
              <div className="flex items-center gap-3 ml-4">
                 <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
                 <p className="text-xs font-medium text-slate-500 hidden md:block">
                    Total: <span className="text-slate-900">{totalItems}</span>
                 </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <THead className="bg-slate-50/50">
                  <TR>
                    <TH className="text-[10px] uppercase tracking-wider">Kode</TH>
                    <TH className="text-[10px] uppercase tracking-wider">Periode</TH>
                    <TH className="text-[10px] uppercase tracking-wider">Semester</TH>
                    <TH className="text-[10px] uppercase tracking-wider">KRS</TH>
                    <TH className="text-[10px] uppercase tracking-wider">Status</TH>
                    <TH className="w-12"></TH>
                  </TR>
                </THead>
                <TBody>
                  {items.length === 0 ? (
                    <TR><TD colSpan={6} className="py-20 text-center text-slate-400 italic">Data tidak ditemukan</TD></TR>
                  ) : (
                    items.map((item) => (
                      <TR key={item.id} className={editingItem?.id === item.id ? 'bg-cyan-50/40 border-l-2 border-l-cyan-500' : ''}>
                        <TD className="font-mono text-xs text-slate-500">{item.kode}</TD>
                        <TD>
                          <p className="font-bold text-slate-900 leading-tight">{item.nama}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(item.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(item.tanggal_selesai).toLocaleDateString('id-ID')}
                          </p>
                        </TD>
                        <TD className="text-sm font-medium text-slate-600">{item.semester}</TD>
                        <TD>
                          <Badge variant={item.is_krs_open ? "success" : "secondary"} className="text-[9px] px-1.5 py-0">
                            {item.is_krs_open ? "Terbuka" : "Tutup"}
                          </Badge>
                        </TD>
                        <TD>
                          <Badge variant={item.is_aktif ? "success" : "secondary"} className="text-[9px] px-1.5 py-0">
                            {item.is_aktif ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TD>
                        <TD>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-11 w-11 sm:h-8 sm:w-8 p-0 hover:bg-white hover:text-amber-600" onClick={() => setEditingItem(item)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-11 w-11 sm:h-8 sm:w-8 p-0 text-rose-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeletingItem(item)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            </div>

            <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
              <p className="text-xs text-slate-500">Hal. {currentPage} dari {totalPages}</p>
              <div className="flex gap-1">
                <Link href={buildPageLink(Math.max(1, currentPage - 1), query)}>
                  <Button variant="secondary" size="sm" className="h-11 sm:h-8 px-4 text-[10px]" disabled={currentPage <= 1}>Prev</Button>
                </Link>
                <Link href={buildPageLink(Math.min(totalPages, currentPage + 1), query)}>
                  <Button variant="secondary" size="sm" className="h-11 sm:h-8 px-4 text-[10px]" disabled={currentPage >= totalPages}>Next</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <DeleteAcademicYearModal
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        item={deletingItem}
      />
    </div>
  );
}
