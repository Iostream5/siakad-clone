"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Download, FileUp, GraduationCap, Pencil, Plus, RotateCcw, Search, Trash2, X, Save } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  bulkDeleteKelasAction,
  bulkHardDeleteKelasAction,
  bulkRestoreKelasAction,
  deleteKelasAction,
  hardDeleteKelasAction,
  importKelasAction,
  restoreKelasAction,
  saveKelasAction,
} from "@/actions/kelas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useActionToast } from "@/lib/use-action-toast";
import type { KelasRow } from "@/lib/admin/kelas";

const initialState = { success: false, message: null };

function buildPageLink(page: number, query: string, view?: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (view && view !== "active") params.set("view", view);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `?${qs}` : "?";
}

function buildModeLink(pathname: string, query: string, view: "active" | "trash" | "all") {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (view !== "active") params.set("view", view);
  const qs = params.toString();
  return `${pathname}${qs ? `?${qs}` : ""}`;
}

function buildExportLink(pathname: string, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  const qs = params.toString();
  return `${pathname}/export${qs ? `?${qs}` : ""}`;
}

function buildTemplateLink(pathname: string) {
  return `${pathname}/template`;
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

function ModalShell({ open, title, description, onClose, children }: { open: boolean; title: string; description: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/60 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.28)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm text-slate-500">{description}</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

function KelasFormModal({ open, onClose, item, prodiList }: { open: boolean; onClose: () => void; item: KelasRow | null; prodiList: Array<{ id: string; nama: string }>; }) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveKelasAction, initialState);

  useActionToast(state, item ? "Data kelas diperbarui" : "Kelas berhasil ditambahkan");

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [onClose, router, state?.success]);

  return (
    <ModalShell open={open} onClose={onClose} title={item ? "Edit Kelas" : "Tambah Kelas"} description="Kelola kelas akademik per program studi">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" value={item?.id ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-2 block text-sm font-medium text-slate-800">Kode Kelas</label><Input name="kode" defaultValue={item?.kode ?? ""} placeholder="IF-3A" required /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-800">Nama Kelas</label><Input name="nama" defaultValue={item?.nama ?? ""} placeholder="Kelas 3A" required /></div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">Program Studi</label>
          <select name="prodiId" defaultValue={item?.program_studi?.id ?? ""} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-500">
            <option value="">Opsional</option>
            {prodiList.map((prodi) => <option key={prodi.id} value={prodi.id}>{prodi.nama}</option>)}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="mb-2 block text-sm font-medium text-slate-800">Angkatan</label><Input name="angkatan" type="number" defaultValue={item?.angkatan ?? ""} placeholder="2026" /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-800">Tingkat</label><Input name="tingkat" defaultValue={item?.tingkat ?? ""} placeholder="Semester 3" /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-800">Kapasitas</label><Input name="kapasitas" type="number" defaultValue={item?.kapasitas ?? 40} required /></div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input type="checkbox" name="isAktif" id="isAktifKelas" defaultChecked={item?.is_active ?? true} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
          <label htmlFor="isAktifKelas" className="text-sm font-medium text-slate-900 cursor-pointer">Kelas aktif</label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <SubmitButton>{item ? "Simpan Perubahan" : "Tambah Kelas"}</SubmitButton>
        </div>
      </form>
    </ModalShell>
  );
}

function DeleteKelasModal({ open, onClose, item }: { open: boolean; onClose: () => void; item: KelasRow | null; }) {
  const router = useRouter();
  const [state, formAction] = useActionState(deleteKelasAction, initialState);

  useActionToast(state, "Kelas berhasil dihapus");

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [onClose, router, state?.success]);
  if (!item) return null;

  return (
    <ModalShell open={open} onClose={onClose} title="Hapus Kelas" description="Konfirmasi penghapusan data kelas">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" value={item.id} />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-900">Anda yakin ingin menghapus kelas berikut?</p>
          <h4 className="mt-2 text-lg font-semibold text-slate-950">{item.nama}</h4>
          <p className="mt-1 text-sm text-slate-600">{item.program_studi?.nama ?? "Program studi belum dipilih"}.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">Hapus</Button>
        </div>
      </form>
    </ModalShell>
  );
}

function ImportKelasModal({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const router = useRouter();
  const [state, formAction] = useActionState(importKelasAction, initialState);

  useActionToast(state, "Import kelas selesai");

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [onClose, router, state?.success]);

  if (!open) return null;

  return (
    <ModalShell open={open} onClose={onClose} title="Import Kelas" description="Unggah file CSV sesuai template">
      <form action={formAction} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Gunakan template CSV agar kolom prodi dapat dikenali dengan benar.
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">File CSV</label>
          <Input name="file" type="file" accept=".csv,text/csv" required />
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit"><FileUp className="mr-2 h-4 w-4" />Import</Button>
        </div>
      </form>
    </ModalShell>
  );
}

export function KelasManager({ items, totalItems, totalPages, currentPage, query, prodiList }: { items: KelasRow[]; totalItems: number; totalPages: number; currentPage: number; query: string; prodiList: Array<{ id: string; nama: string }>; }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("view") === "trash" ? "trash" : searchParams.get("view") === "all" ? "all" : "active";
  const [search, setSearch] = useState(query);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KelasRow | null>(null);
  const [deletingItem, setDeletingItem] = useState<KelasRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [restoreState, restoreAction] = useActionState(restoreKelasAction, initialState);
  const [hardDeleteState, hardDeleteAction] = useActionState(hardDeleteKelasAction, initialState);
  const [bulkDeleteState, bulkDeleteAction] = useActionState(bulkDeleteKelasAction, initialState);
  const [bulkRestoreState, bulkRestoreAction] = useActionState(bulkRestoreKelasAction, initialState);
  const [bulkHardDeleteState, bulkHardDeleteAction] = useActionState(bulkHardDeleteKelasAction, initialState);

  useActionToast(restoreState, "Kelas dipulihkan");
  useActionToast(hardDeleteState, "Kelas dihapus permanen");
  useActionToast(bulkDeleteState, "Kelas dipindahkan ke sampah");
  useActionToast(bulkRestoreState, "Kelas dipulihkan");
  useActionToast(bulkHardDeleteState, "Kelas dihapus permanen");

  const visibleItemIds = new Set(items.map((item) => item.id));
  const visibleSelectedIds = selectedIds.filter((id) => visibleItemIds.has(id));

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) params.set("q", search.trim());
    else params.delete("q");
    params.delete("page");
    if (mode !== "active") params.set("view", mode);
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleAll() {
    const itemIds = items.map((item) => item.id);

    if (visibleSelectedIds.length === itemIds.length) {
      setSelectedIds((current) => current.filter((id) => !visibleItemIds.has(id)));
      return;
    }

    setSelectedIds((current) => [
      ...current.filter((id) => !visibleItemIds.has(id)),
      ...itemIds,
    ]);
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-white/60 bg-white/80 backdrop-blur-md shadow-xl shadow-slate-200/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><GraduationCap className="h-5 w-5" /></div>
            <div><h3 className="text-xl font-semibold text-slate-900">Data Kelas</h3><p className="text-sm text-slate-500">Kelas akademik per prodi, angkatan, dan kapasitas.</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={buildModeLink(pathname, query, "active")}><Button variant={mode === "active" ? "default" : "secondary"}>Aktif</Button></Link>
            <Link href={buildModeLink(pathname, query, "trash")}><Button variant={mode === "trash" ? "default" : "secondary"}>Sampah</Button></Link>
            <Button variant="secondary" onClick={() => setImportOpen(true)}><FileUp className="mr-2 h-4 w-4" />Import CSV</Button>
            <Link href={buildExportLink(pathname, query)}><Button variant="secondary"><Download className="mr-2 h-4 w-4" />Export CSV</Button></Link>
            <Link href={buildTemplateLink(pathname)}><Button variant="secondary">Template CSV</Button></Link>
            <Button onClick={() => { setEditingItem(null); setFormOpen(true); }}><Plus className="mr-2 h-4 w-4" />Tambah data</Button>
          </div>
        </div>
        <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kode, nama, atau tingkat kelas..." className="pl-10" />
          </div>
          <div className="flex gap-2"><Button type="submit">Cari</Button><Link href={pathname}><Button type="button" variant="secondary">Reset</Button></Link></div>
        </form>
        {visibleSelectedIds.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium text-cyan-900">{visibleSelectedIds.length} data dipilih</p>
            <div className="flex flex-wrap gap-2">
              {mode === "trash" ? (
                <>
                  <form action={bulkRestoreAction}>{visibleSelectedIds.map((id) => <input key={`r-${id}`} type="hidden" name="ids" value={id} />)}<Button type="submit" variant="secondary" size="sm"><RotateCcw className="mr-2 h-4 w-4" />Pulihkan</Button></form>
                  <form action={bulkHardDeleteAction}>{visibleSelectedIds.map((id) => <input key={`h-${id}`} type="hidden" name="ids" value={id} />)}<Button type="submit" size="sm" className="bg-rose-600 text-white hover:bg-rose-700">Hapus Permanen</Button></form>
                </>
              ) : (
                <form action={bulkDeleteAction}>{visibleSelectedIds.map((id) => <input key={`d-${id}`} type="hidden" name="ids" value={id} />)}<Button type="submit" variant="secondary" size="sm" className="text-rose-700">Pindahkan ke Sampah</Button></form>
              )}
            </div>
          </div>
        )}
        <div className="mt-5 overflow-x-auto">
          <Table>
            <THead><TR><TH className="w-12 px-3"><Checkbox checked={items.length > 0 && visibleSelectedIds.length === items.length} onCheckedChange={() => toggleAll()} /></TH><TH>Kode</TH><TH>Kelas</TH><TH>Prodi</TH><TH>Detail</TH><TH>Status</TH><TH className="w-[160px]">Aksi</TH></TR></THead>
            <TBody>
              {items.length === 0 ? <TR><TD colSpan={7} className="py-10 text-center text-slate-500">Data tidak ditemukan</TD></TR> : items.map((item) => (
                <TR key={item.id}>
                  <TD className="px-3"><Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelected(item.id)} /></TD>
                  <TD className="font-mono text-xs">{item.kode}</TD>
                  <TD><p className="font-semibold text-slate-900">{item.nama}</p><p className="text-xs text-slate-500">Angkatan {item.angkatan ?? "-"}</p></TD>
                  <TD className="text-sm text-slate-600">{item.program_studi?.nama ?? "-"}</TD>
                  <TD className="text-sm text-slate-600">{item.tingkat || "-"} | {item.kapasitas} kursi</TD>
                  <TD><Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Aktif" : "Nonaktif"}</Badge></TD>
                  <TD>
                    {mode === "trash" ? (
                      <div className="flex gap-2">
                        <form action={restoreAction}><input type="hidden" name="id" value={item.id} /><Button type="submit" variant="secondary" size="sm" className="h-9 w-9 p-0"><RotateCcw className="h-3.5 w-3.5" /></Button></form>
                        <form action={hardDeleteAction}><input type="hidden" name="id" value={item.id} /><Button type="submit" size="sm" className="h-9 w-9 p-0 bg-rose-600 hover:bg-rose-700 text-white"><Trash2 className="h-3.5 w-3.5" /></Button></form>
                      </div>
                    ) : (
                      <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => { setEditingItem(item); setFormOpen(true); }} className="h-9 w-9 p-0"><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="sm" onClick={() => setDeletingItem(item)} className="h-9 w-9 p-0 text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></Button></div>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">Menampilkan {items.length} dari {totalItems} data.</p>
          <div className="flex flex-wrap gap-2">
            <Link href={buildPageLink(Math.max(1, currentPage - 1), query, mode)}><Button variant="secondary" size="sm" disabled={currentPage <= 1}>Sebelumnya</Button></Link>
            <Link href={buildPageLink(Math.min(totalPages, currentPage + 1), query, mode)}><Button variant="secondary" size="sm" disabled={currentPage >= totalPages}>Berikutnya</Button></Link>
          </div>
        </div>
      </Card>
      <KelasFormModal open={formOpen} onClose={() => setFormOpen(false)} item={editingItem} prodiList={prodiList} />
      <ImportKelasModal open={importOpen} onClose={() => setImportOpen(false)} />
      <DeleteKelasModal open={Boolean(deletingItem)} onClose={() => setDeletingItem(null)} item={deletingItem} />
    </div>
  );
}
