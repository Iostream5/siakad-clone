"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowDown, ArrowUp, Menu, Pencil, Plus, Search, Trash2, X, Save } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { deleteMenuAction, moveMenuAction, saveMenuAction } from "@/actions/menus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { roles } from "@/lib/constants";
import { useActionToast } from "@/lib/use-action-toast";
import type { MenuRow } from "@/lib/admin/menus";
import type { UserRole } from "@/types/domain";

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
      {pending ? "Menyimpan..." : <><Save className="mr-2 h-4 w-4" />{children}</>}
    </Button>
  );
}

function ModalShell({ open, title, description, onClose, children }: { open: boolean; title: string; description: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/60 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.28)]" onClick={(e) => e.stopPropagation()}>
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

function MenuFormModal({
  open,
  onClose,
  item,
  menuItems,
}: {
  open: boolean;
  onClose: () => void;
  item: MenuRow | null;
  menuItems: MenuRow[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveMenuAction, initialState);

  useActionToast(state, item ? "Menu diperbarui" : "Menu berhasil ditambahkan");

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [onClose, router, state?.success]);

  const parentOptions = useMemo(
    () => menuItems.filter((row) => row.key !== item?.key && row.is_active),
    [item?.key, menuItems],
  );

  return (
    <ModalShell open={open} onClose={onClose} title={item ? "Edit Menu" : "Tambah Menu"} description="Kelola menu, parent, icon, dan role default">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" value={item?.id ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Key</label>
            <Input name="key" defaultValue={item?.key ?? ""} placeholder="master-data.kampus" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Label</label>
            <Input name="label" defaultValue={item?.label ?? ""} placeholder="Kampus" required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Href</label>
            <Input name="href" defaultValue={item?.href ?? ""} placeholder="/dashboard/master-data/kampus" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Icon</label>
            <Input name="icon" defaultValue={item?.icon ?? ""} placeholder="Building2" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Parent Menu</label>
            <select name="parentKey" defaultValue={item?.parent_key ?? ""} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-500">
              <option value="">Root</option>
              {parentOptions.map((menu) => (
                <option key={menu.id} value={menu.key}>{menu.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Sort Order</label>
            <Input name="sortOrder" type="number" defaultValue={item?.sort_order ?? 0} required />
          </div>
          <div className="flex items-end">
            <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">
              <input type="checkbox" name="isActive" defaultChecked={item?.is_active ?? true} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
              <span className="text-sm font-medium text-slate-900">Menu aktif</span>
            </label>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-800">Role default yang boleh melihat menu</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roles.map((role) => {
              const checked = (item?.roles ?? []).includes(role);
              return (
                <label key={role} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <input type="checkbox" name="roles" value={role} defaultChecked={checked} className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600" />
                  <span className="text-sm font-medium text-slate-900">{role}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <SubmitButton>{item ? "Simpan Perubahan" : "Tambah Menu"}</SubmitButton>
        </div>
      </form>
    </ModalShell>
  );
}

function DeleteMenuModal({ open, onClose, item }: { open: boolean; onClose: () => void; item: MenuRow | null }) {
  const router = useRouter();
  const [state, formAction] = useActionState(deleteMenuAction, initialState);

  useActionToast(state, "Menu berhasil dihapus");

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [onClose, router, state?.success]);

  if (!item) return null;

  return (
    <ModalShell open={open} onClose={onClose} title="Hapus Menu" description="Konfirmasi penghapusan menu">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" value={item.id} />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-900">Anda yakin ingin menghapus menu berikut?</p>
          <h4 className="mt-2 text-lg font-semibold text-slate-950">{item.label}</h4>
          <p className="mt-1 text-sm text-slate-600">{item.key}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">Hapus</Button>
        </div>
      </form>
    </ModalShell>
  );
}

export function MenuBuilderManager({
  items,
  totalItems,
  totalPages,
  currentPage,
  query,
  source,
}: {
  items: MenuRow[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
  source: "database" | "fallback";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(query);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuRow | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuRow | null>(null);

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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Menu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Menu Builder</h3>
              <p className="text-sm text-slate-500">Kelola struktur menu, icon, parent, dan akses default role.</p>
            </div>
          </div>
          <Button onClick={() => { setEditingItem(null); setFormOpen(true); }}><Plus className="mr-2 h-4 w-4" />Tambah menu</Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant={source === "database" ? "success" : "secondary"}>{source === "database" ? "Database" : "Fallback"}</Badge>
          <Badge>{totalItems} menu</Badge>
        </div>

        <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari key, label, atau href..." className="pl-10" />
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
                <TH>Menu</TH>
                <TH>Parent</TH>
                <TH>Role</TH>
                <TH>Order</TH>
                <TH>Status</TH>
                <TH className="w-[170px]">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {items.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="py-10 text-center text-slate-500">Data tidak ditemukan</TD>
                </TR>
              ) : (
                items.map((item) => (
                  <TR key={item.id}>
                    <TD>
                      <p className="font-semibold text-slate-900">{item.label}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">{item.key}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.href}</p>
                    </TD>
                    <TD className="text-sm text-slate-600">{item.parent_key ?? "-"}</TD>
                    <TD>
                      <div className="flex flex-wrap gap-1.5">
                        {item.roles.length === 0 ? <span className="text-xs text-slate-400">-</span> : item.roles.map((role) => <Badge key={role} variant="outline">{role}</Badge>)}
                      </div>
                    </TD>
                    <TD className="font-mono text-xs text-slate-700">{item.sort_order}</TD>
                    <TD>
                      <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Aktif" : "Nonaktif"}</Badge>
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-2">
                        <form action={moveMenuAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="direction" value="up" />
                          <Button variant="secondary" size="sm" className="h-9 w-9 p-0" title="Naikkan urutan">
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                        <form action={moveMenuAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="direction" value="down" />
                          <Button variant="secondary" size="sm" className="h-9 w-9 p-0" title="Turunkan urutan">
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </form>
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
          <p className="text-sm text-slate-500">Menampilkan {items.length} dari {totalItems} menu.</p>
          <div className="flex flex-wrap gap-2">
            <Link href={buildPageLink(Math.max(1, currentPage - 1), query)}><Button variant="secondary" size="sm" disabled={currentPage <= 1}>Sebelumnya</Button></Link>
            <Link href={buildPageLink(Math.min(totalPages, currentPage + 1), query)}><Button variant="secondary" size="sm" disabled={currentPage >= totalPages}>Berikutnya</Button></Link>
          </div>
        </div>
      </Card>

      <MenuFormModal open={formOpen} onClose={() => setFormOpen(false)} item={editingItem} menuItems={items} />
      <DeleteMenuModal open={Boolean(deletingItem)} onClose={() => setDeletingItem(null)} item={deletingItem} />
    </div>
  );
}
