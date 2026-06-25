"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Loader2, Pencil, Search, Trash2, X, Users } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { deleteUserAction, resetUserPasswordAction, updateUserAction } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { roles } from "@/lib/constants";
import { useActionToast } from "@/lib/use-action-toast";

type UserItem = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

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
  return <Button type="submit" disabled={pending}>{pending ? "Menyimpan..." : children}</Button>;
}

function ModalShell({ open, title, description, onClose, children }: any) {
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
          <button type="button" onClick={onClose} className="inline-flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

function UserFormModal({ open, onClose, item }: { open: boolean, onClose: () => void, item: UserItem | null }) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateUserAction as any, initialState);
  useActionToast(state, "Data pengguna diperbarui");
  useEffect(() => { if (state?.success) { onClose(); router.refresh(); } }, [onClose, router, state?.success]);

  return (
    <ModalShell open={open} onClose={onClose} title={item ? "Edit Pengguna" : "Tambah Pengguna"} description="Kelola profil dan role akses pengguna">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" value={item?.id ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Nama Lengkap</label>
            <Input name="fullName" defaultValue={item?.full_name ?? ""} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Email</label>
            <Input name="email" type="email" defaultValue={item?.email ?? ""} required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">Role Utama</label>
            <select name="role" defaultValue={item?.role ?? "Staff"} className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-500">
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-end">
             <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 w-full cursor-pointer">
                <input type="checkbox" name="isActive" defaultChecked={item?.is_active ?? true} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                <span className="text-sm font-medium text-slate-900">Akun Aktif</span>
             </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <SubmitButton>Simpan Perubahan</SubmitButton>
        </div>
      </form>
    </ModalShell>
  );
}

function ResetPasswordSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-amber-600 hover:bg-amber-700 text-white">
      {pending ? (
        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mereset...</>
      ) : (
        "Reset Password"
      )}
    </Button>
  );
}

function ResetPasswordModal({ open, onClose, item }: { open: boolean, onClose: () => void, item: UserItem | null }) {
  if (!item) return null;
  return (
    <ModalShell open={open} onClose={onClose} title="Reset Password" description="Setel ulang kata sandi ke default">
      <form action={resetUserPasswordAction} className="space-y-5">
        <input type="hidden" name="id" value={item.id} />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">Reset password untuk akun berikut?</p>
          <h4 className="mt-2 text-lg font-semibold text-slate-950">{item.full_name}</h4>
          <p className="mt-1 text-sm text-slate-600">{item.email}</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-amber-700">Password baru: stai12345</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <ResetPasswordSubmitButton />
        </div>
      </form>
    </ModalShell>
  );
}

function DeleteUserModal({ open, onClose, item }: { open: boolean, onClose: () => void, item: UserItem | null }) {
  const router = useRouter();
  const [state, formAction] = useActionState(deleteUserAction as any, initialState);
  useActionToast(state, "Pengguna berhasil dihapus");
  useEffect(() => { if (state?.success) { onClose(); router.refresh(); } }, [onClose, router, state?.success]);
  if (!item) return null;
  return (
    <ModalShell open={open} onClose={onClose} title="Hapus Pengguna" description="Konfirmasi penghapusan akun">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" value={item.id} />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-900">Hapus akun berikut?</p>
          <h4 className="mt-2 text-lg font-semibold text-slate-950">{item.full_name}</h4>
          <p className="mt-1 text-sm text-slate-600">{item.email} | {item.role}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">Hapus</Button>
        </div>
      </form>
    </ModalShell>
  );
}

export function UserManager({ items, totalItems, totalPages, currentPage, query }: any) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(query);


  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<UserItem | null>(null);
  const [resettingItem, setResettingItem] = useState<UserItem | null>(null);

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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Manajemen Pengguna</h3>
          </div>
        </div>
        <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau email..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Cari</Button>
            <Link href={pathname}><Button type="button" variant="secondary">Reset</Button></Link>
          </div>
        </form>
        <div className="mt-5 overflow-x-auto">
          <Table>
            <THead><TR><TH>Pengguna</TH><TH>Role</TH><TH>Status</TH><TH>Dibuat</TH><TH className="w-[120px]">Aksi</TH></TR></THead>
            <TBody>
              {items.length === 0 ? <TR><TD colSpan={5} className="py-10 text-center text-slate-500">Data tidak ditemukan</TD></TR> : items.map((item: any) => (
                <TR key={item.id}>
                  <TD><p className="font-semibold text-slate-900">{item.full_name}</p><p className="text-xs text-slate-500">{item.email}</p></TD>
                  <TD><Badge variant="outline">{item.role}</Badge></TD>
                  <TD><Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Aktif" : "Nonaktif"}</Badge></TD>
                  <TD className="text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString('id-ID')}</TD>
                  <TD>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => { setEditingItem(item); setFormOpen(true); }} className="h-11 w-11 sm:h-9 sm:w-9 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setResettingItem(item)} className="h-11 w-11 sm:h-9 sm:w-9 p-0 text-amber-600 hover:bg-amber-50"><KeyRound className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeletingItem(item)} className="h-11 w-11 sm:h-9 sm:w-9 p-0 text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">Menampilkan {items.length} dari {totalItems} akun.</p>
          <div className="flex flex-wrap gap-2">
            <Link href={buildPageLink(Math.max(1, currentPage - 1), query)}><Button variant="secondary" size="sm" disabled={currentPage <= 1}>Sebelumnya</Button></Link>
            <Link href={buildPageLink(Math.min(totalPages, currentPage + 1), query)}><Button variant="secondary" size="sm" disabled={currentPage >= totalPages}>Berikutnya</Button></Link>
          </div>
        </div>
      </Card>
      <UserFormModal open={formOpen} onClose={() => setFormOpen(false)} item={editingItem} />
      <ResetPasswordModal open={Boolean(resettingItem)} onClose={() => setResettingItem(null)} item={resettingItem} />
      <DeleteUserModal open={Boolean(deletingItem)} onClose={() => setDeletingItem(null)} item={deletingItem} />
    </div>
  );
}
