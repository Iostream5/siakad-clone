"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Download, Pencil, Plus, Search, Trash2, X, UserCheck } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { deleteDosenAction, type DosenActionState, upsertDosenAction } from "@/actions/dosen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { DosenRow } from "@/lib/admin/dosen";
import { useActionToast } from "@/lib/use-action-toast";

const initialState: DosenActionState = {
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
    <Button type="submit" disabled={pending}>
      {pending ? "Menyimpan..." : children}
    </Button>
  );
}

function ModalShell({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose}>
      <div className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/50 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.28)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm text-slate-500">{description}</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

function DosenFormModal({
  open,
  onClose,
  item,
  prodiList,
}: {
  open: boolean;
  onClose: () => void;
  item: DosenRow | null;
  prodiList: { id: string; nama: string }[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(upsertDosenAction, initialState);
  useActionToast(state, item ? "Data dosen diperbarui" : "Dosen berhasil ditambahkan");

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [onClose, router, state?.success]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={item ? "Edit Dosen" : "Tambah Dosen"}
      description="Kelola profil biodata dan homebase dosen"
    >
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" value={item?.id ?? ""} />

        {!item && (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Info Akun Baru</p>
            <p className="mt-1 text-sm leading-6 text-cyan-900">
              Akun dosen akan otomatis dibuat dengan password default: <code className="rounded bg-white px-1.5 py-0.5 font-bold">dosen123</code>
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Nama Lengkap</label>
            <Input name="fullName" defaultValue={item?.users?.full_name ?? ""} placeholder="Contoh: Ahmad Dahlan" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Email Kampus</label>
            <Input name="email" type="email" defaultValue={item?.users?.email ?? ""} placeholder="ahmad@stai.ac.id" required />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">NIDN</label>
            <Input name="nidn" defaultValue={item?.nidn ?? ""} placeholder="10 digit NIDN" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">NIP</label>
            <Input name="nip" defaultValue={item?.nip ?? ""} placeholder="NIP (opsional)" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Gelar Akhir</label>
            <Input name="gelar" defaultValue={item?.gelar ?? ""} placeholder="M.Pd., Ph.D." />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Homebase Prodi</label>
            <select
              name="homebaseProdiId"
              defaultValue={item?.homebase_prodi_id ?? ""}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500"
              required
            >
              <option value="">Pilih Program Studi</option>
              {prodiList.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Status Aktif</label>
            <select
              name="statusDosen"
              defaultValue={item?.status_dosen ?? "AKTIF"}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500"
              required
            >
              <option value="AKTIF">Aktif</option>
              <option value="NON-AKTIF">Non-Aktif</option>
              <option value="TUGAS-BELAJAR">Tugas Belajar</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <SubmitButton>{item ? "Simpan Perubahan" : "Tambah Dosen"}</SubmitButton>
        </div>
      </form>
    </ModalShell>
  );
}

function DeleteDosenModal({ open, onClose, item }: { open: boolean, onClose: () => void, item: DosenRow | null }) {
  const router = useRouter();
  const [state, formAction] = useActionState(deleteDosenAction, initialState);
  useActionToast(state, "Dosen berhasil dihapus");

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [onClose, router, state?.success]);

  if (!item) return null;

  return (
    <ModalShell open={open} onClose={onClose} title="Hapus Dosen" description="Konfirmasi penghapusan data dosen">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" value={item.id} />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-900">Anda yakin ingin menghapus dosen berikut?</p>
          <h4 className="mt-2 text-lg font-semibold text-slate-950">{item.users?.full_name}</h4>
          <p className="mt-1 text-sm text-slate-600">NIDN: {item.nidn ?? "-"}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">Hapus</Button>
        </div>
      </form>
    </ModalShell>
  );
}

export function DosenManager({
  items,
  totalItems,
  totalPages,
  currentPage,
  query,
  prodiList,
}: {
  items: DosenRow[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
  prodiList: { id: string; nama: string }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(query);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DosenRow | null>(null);
  const [deletingItem, setDeletingItem] = useState<DosenRow | null>(null);

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
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Data Dosen</h3>
          </div>
          <div className="flex flex-wrap gap-2">
             <Button variant="secondary">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            <Button onClick={() => { setEditingItem(null); setFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Tambah data
            </Button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari NIDN atau NIP..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Cari</Button>
            <Link href={pathname}><Button type="button" variant="secondary">Reset</Button></Link>
          </div>
        </form>

        <div className="mt-5 overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Dosen</TH>
                <TH>NIDN / NIP</TH>
                <TH>Homebase</TH>
                <TH>Status</TH>
                <TH className="w-[120px]">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {items.length === 0 ? (
                <TR><TD colSpan={5} className="py-10 text-center text-slate-500">Data tidak ditemukan</TD></TR>
              ) : (
                items.map((item) => (
                  <TR key={item.id}>
                    <TD>
                      <p className="font-semibold text-slate-900">{item.users?.full_name}{item.gelar ? `, ${item.gelar}` : ""}</p>
                      <p className="text-xs text-slate-500">{item.users?.email}</p>
                    </TD>
                    <TD>
                      <p className="text-sm">{item.nidn ?? "-"}</p>
                      <p className="text-xs text-slate-400">{item.nip ?? "-"}</p>
                    </TD>
                    <TD>{item.program_studi?.nama ?? "-"}</TD>
                    <TD><Badge variant={item.status_dosen === "AKTIF" ? "default" : "secondary"}>{item.status_dosen}</Badge></TD>
                    <TD>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => { setEditingItem(item); setFormOpen(true); }} className="h-11 w-11 sm:h-9 sm:w-9 p-0">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletingItem(item)} className="h-11 w-11 sm:h-9 sm:w-9 p-0 text-rose-600 hover:bg-rose-50">
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

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">Menampilkan {items.length} dari {totalItems} data.</p>
          <div className="flex flex-wrap gap-2">
            <Link href={buildPageLink(Math.max(1, currentPage - 1), query)}>
              <Button variant="secondary" size="sm" disabled={currentPage <= 1}>Sebelumnya</Button>
            </Link>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
               <Link key={page} href={buildPageLink(page, query)}>
                  <Button variant={page === currentPage ? "default" : "secondary"} size="sm">{page}</Button>
               </Link>
            ))}
            <Link href={buildPageLink(Math.min(totalPages, currentPage + 1), query)}>
              <Button variant="secondary" size="sm" disabled={currentPage >= totalPages}>Berikutnya</Button>
            </Link>
          </div>
        </div>
      </Card>

      <DosenFormModal open={formOpen} onClose={() => setFormOpen(false)} item={editingItem} prodiList={prodiList} />
      <DeleteDosenModal open={Boolean(deletingItem)} onClose={() => setDeletingItem(null)} item={deletingItem} />
    </div>
  );
}
