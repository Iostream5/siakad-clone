"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Download, FileUp, Pencil, Plus, Search, Trash2, X, Building2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { deleteFacultyAction, saveFacultyAction } from "@/actions/faculties";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useActionToast } from "@/lib/use-action-toast";

type FacultyItem = {
  id: string;
  kode: string;
  nama: string;
  dekan: string | null;
  deskripsi: string | null;
  is_active: boolean;
  updated_at: string;
};

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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
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
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

function FacultyFormModal({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: FacultyItem | null;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveFacultyAction, initialState);

  useActionToast(state, item ? "Data fakultas diperbarui" : "Fakultas berhasil ditambahkan");

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
      title={item ? "Edit Fakultas" : "Tambah Fakultas"}
      description="Lengkapi informasi dasar fakultas di bawah ini"
    >
      <form action={formAction} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Kode Fakultas</label>
            <Input name="kode" defaultValue={item?.kode ?? ""} placeholder="Contoh: FTI, FEB" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Nama Fakultas</label>
            <Input name="nama" defaultValue={item?.nama ?? ""} placeholder="Contoh: Teknologi Informasi" required />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">Dekan</label>
          <Input name="dekan" defaultValue={item?.dekan ?? ""} placeholder="Nama Dekan beserta gelar" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">Deskripsi</label>
          <textarea
            name="deskripsi"
            defaultValue={item?.deskripsi ?? ""}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500"
            placeholder="Keterangan singkat..."
          />
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            type="checkbox"
            name="isAktif"
            id="isAktif"
            defaultChecked={item?.is_active ?? true}
            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          <label htmlFor="isAktif" className="text-sm font-medium text-slate-900 cursor-pointer">Fakultas Aktif</label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <SubmitButton>{item ? "Simpan Perubahan" : "Tambah Fakultas"}</SubmitButton>
        </div>
      </form>
    </ModalShell>
  );
}

function ImportFacultiesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ModalShell open={open} onClose={onClose} title="Import Fakultas" description="Gunakan format CSV untuk import massal">
      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-500">Fitur import sedang dalam pengembangan.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Tutup</Button>
        </div>
      </div>
    </ModalShell>
  );
}

function DeleteFacultyModal({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: FacultyItem | null;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(deleteFacultyAction, initialState);

  useActionToast(state, "Fakultas berhasil dihapus");

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [onClose, router, state?.success]);

  if (!item) return null;

  return (
    <ModalShell open={open} onClose={onClose} title="Hapus Fakultas" description="Konfirmasi penghapusan data fakultas">
      <form action={formAction} className="space-y-5">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-900">Anda yakin ingin menghapus fakultas berikut?</p>
          <h4 className="mt-2 text-lg font-semibold text-slate-950">{item.nama}</h4>
          <p className="mt-1 text-sm text-slate-600">Seluruh data program studi di bawahnya akan terdampak.</p>
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
    </ModalShell>
  );
}

export function FacultiesManager({
  items,
  totalItems,
  totalPages,
  currentPage,
  query,
}: {
  items: FacultyItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(query);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FacultyItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<FacultyItem | null>(null);

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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Data Fakultas</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <FileUp className="mr-2 h-4 w-4" /> Import CSV
            </Button>
            <Button onClick={() => { setEditingItem(null); setFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Tambah data
            </Button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama fakultas..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Cari</Button>
            <Link href={pathname}>
              <Button type="button" variant="secondary">Reset</Button>
            </Link>
          </div>
        </form>

        <div className="mt-5 overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Kode</TH>
                <TH>Fakultas</TH>
                <TH>Dekan</TH>
                <TH>Status</TH>
                <TH className="w-[120px]">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {items.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="py-10 text-center text-slate-500">Data tidak ditemukan</TD>
                </TR>
              ) : (
                items.map((item) => (
                  <TR key={item.id}>
                    <TD className="font-mono text-xs">{item.kode}</TD>
                    <TD>
                      <p className="font-semibold text-slate-900">{item.nama}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{item.deskripsi || "Tidak ada deskripsi"}</p>
                    </TD>
                    <TD className="text-sm">{item.dekan || "-"}</TD>
                    <TD>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TD>
                    <TD>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { setEditingItem(item); setFormOpen(true); }}
                          className="h-9 w-9 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingItem(item)}
                          className="h-9 w-9 p-0 text-rose-600 hover:bg-rose-50"
                        >
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
            <Link href={buildPageLink(Math.min(totalPages, currentPage + 1), query)}>
              <Button variant="secondary" size="sm" disabled={currentPage >= totalPages}>Berikutnya</Button>
            </Link>
          </div>
        </div>
      </Card>

      <FacultyFormModal open={formOpen} onClose={() => setFormOpen(false)} item={editingItem} />
      <ImportFacultiesModal open={importOpen} onClose={() => setImportOpen(false)} />
      <DeleteFacultyModal open={Boolean(deletingItem)} onClose={() => setDeletingItem(null)} item={deletingItem} />
    </div>
  );
}
