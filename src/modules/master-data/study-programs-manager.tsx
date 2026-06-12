"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Library, Pencil, Plus, Search, Trash2, X, RotateCcw, Save } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { deleteStudyProgramAction, saveStudyProgramAction } from "@/actions/study-programs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useActionToast } from "@/lib/use-action-toast";

const initialState = { success: false, message: null };

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

function DeleteStudyProgramModal({ open, onClose, item }: any) {
  const router = useRouter();
  const [state, formAction] = useActionState(deleteStudyProgramAction as any, initialState);
  useActionToast(state, "Program studi berhasil dihapus");
  useEffect(() => { if (state?.success) { onClose(); router.refresh(); } }, [onClose, router, state?.success]);
  if (!open || !item) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-xl font-bold text-slate-900">Hapus Program Studi</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
        </div>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="id" value={item.id} />
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm text-rose-900">Hapus program studi berikut?</p>
            <h4 className="mt-2 text-lg font-semibold text-slate-950">{item.nama}</h4>
            <p className="mt-1 text-sm text-slate-600">Seluruh data kurikulum dan mahasiswa di dalamnya akan terdampak.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">Hapus Permanen</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function StudyProgramsManager({ items, totalItems, totalPages, currentPage, query, faculties }: any) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(query);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);

  // Form handling
  const resetForm = () => setEditingItem(null);

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
      <Card className="border-none bg-[linear-gradient(135deg,#6366f1,#a855f7)] p-6 shadow-lg shadow-indigo-900/10">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] backdrop-blur-md">
            <Library className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Program Studi</h3>
            <p className="text-indigo-50/80 text-sm font-medium mt-0.5">Manajemen kurikulum, jenjang pendidikan, dan fakultas pengampu</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        
        {/* KOLOM KIRI: FORM INPUT */}
        <div className="space-y-6">
          <Card className="sticky top-24 border-white/60 bg-white/80 backdrop-blur-md shadow-xl shadow-slate-200/50">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
               <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  {editingItem ? <Pencil className="h-4 w-4 text-amber-500" /> : <Plus className="h-4 w-4 text-cyan-600" />}
                  {editingItem ? 'Edit Program Studi' : 'Tambah Program Studi'}
               </h3>
               {editingItem && (
                 <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 w-8 p-0 rounded-full">
                    <X className="h-4 w-4" />
                 </Button>
               )}
            </div>

            <div className="p-6">
               <form action={saveStudyProgramAction as any} className="space-y-4">
                  <input type="hidden" name="id" value={editingItem?.id || ""} />
                  
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Kode Prodi</label>
                        <Input name="kode" key={editingItem?.id || 'new-k'} defaultValue={editingItem?.kode} placeholder="PAI" required />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Jenjang</label>
                        <select name="jenjang" key={editingItem?.id || 'new-j'} defaultValue={editingItem?.jenjang ?? "S1"} className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 outline-none">
                           <option value="S1">Sarjana (S1)</option>
                           <option value="S2">Magister (S2)</option>
                           <option value="D3">Diploma (D3)</option>
                        </select>
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Nama Program Studi</label>
                     <Input name="nama" key={editingItem?.id || 'new-n'} defaultValue={editingItem?.nama} placeholder="Ekonomi Syariah" required />
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Fakultas</label>
                     <select name="fakultasId" key={editingItem?.id || 'new-f'} className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 outline-none" defaultValue={editingItem?.fakultas?.id || ""} required>
                        <option value="">Pilih Fakultas</option>
                        {faculties.map((f: any) => <option key={f.id} value={f.id}>{f.nama}</option>)}
                     </select>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                     <input type="checkbox" name="isAktif" id="isAktif" defaultChecked={editingItem?.is_active ?? true} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                     <label htmlFor="isAktif" className="text-sm font-medium text-slate-700 cursor-pointer">Prodi Aktif</label>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                     <SubmitButton>{editingItem ? "Update Program Studi" : "Simpan Program Studi"}</SubmitButton>
                     {editingItem && (
                       <Button type="button" variant="secondary" onClick={resetForm} className="w-full">
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
                 <Input placeholder="Cari prodi..." className="pl-10 h-9 bg-white border-slate-200" value={search} onChange={(e) => setSearch(e.target.value)} />
              </form>
              <div className="ml-4">
                 <p className="text-xs font-medium text-slate-500">Total: <span className="text-slate-900">{totalItems}</span></p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <THead className="bg-slate-50/50">
                  <TR>
                    <TH className="text-[10px] uppercase tracking-wider">Info Prodi</TH>
                    <TH className="text-[10px] uppercase tracking-wider">Fakultas</TH>
                    <TH className="text-[10px] uppercase tracking-wider">Status</TH>
                    <TH className="w-12"></TH>
                  </TR>
                </THead>
                <TBody>
                  {items.length === 0 ? (
                    <TR><TD colSpan={4} className="py-20 text-center text-slate-400 italic">Data tidak ditemukan</TD></TR>
                  ) : (
                    items.map((item: any) => (
                      <TR key={item.id} className={editingItem?.id === item.id ? 'bg-cyan-50/40 border-l-2 border-l-cyan-500' : ''}>
                        <TD>
                           <p className="font-bold text-slate-900 leading-tight">{item.nama}</p>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 rounded">{item.kode}</span>
                              <span className="text-[10px] font-bold text-indigo-600 uppercase">{item.jenjang}</span>
                           </div>
                        </TD>
                        <TD className="text-sm font-medium text-slate-700">{item.fakultas?.nama || "-"}</TD>
                        <TD><Badge variant={item.is_active ? "success" : "secondary"}>{item.is_active ? "Aktif" : "Nonaktif"}</Badge></TD>
                        <TD>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white hover:text-amber-600" onClick={() => setEditingItem(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeletingItem(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
                <Link href={buildPageLink(Math.max(1, currentPage - 1), query)}><Button variant="secondary" size="sm" className="h-8 text-[10px]" disabled={currentPage <= 1}>Prev</Button></Link>
                <Link href={buildPageLink(Math.min(totalPages, currentPage + 1), query)}><Button variant="secondary" size="sm" className="h-8 text-[10px]" disabled={currentPage >= totalPages}>Next</Button></Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <DeleteStudyProgramModal open={Boolean(deletingItem)} onClose={() => setDeletingItem(null)} item={deletingItem} />
    </div>
  );
}
