"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X, Megaphone } from "lucide-react";
import { useRouter } from "next/navigation";

import { deleteAnnouncementAction, saveAnnouncementAction } from "@/actions/announcements";
import type { AnnouncementActionState } from "@/actions/announcements";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { roles } from "@/lib/constants";
import { useActionToast } from "@/lib/use-action-toast";
import type { AnnouncementRow } from "@/lib/admin/announcements";

const initialState: AnnouncementActionState = { success: false, message: null };

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
          <button type="button" onClick={onClose} className="inline-flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

function AnnouncementFormModal({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: AnnouncementRow | null;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveAnnouncementAction, initialState);
  useActionToast(state, "Pengumuman berhasil disimpan");
  useEffect(() => { if (state?.success) { onClose(); router.refresh(); } }, [onClose, router, state?.success]);

  return (
    <ModalShell open={open} onClose={onClose} title={item ? "Edit Pengumuman" : "Tambah Pengumuman"} description="Siarkan informasi penting ke dashboard pengguna">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={item?.id ?? ""} />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">Judul Pengumuman</label>
          <Input name="judul" defaultValue={item?.judul ?? ""} placeholder="Contoh: Jadwal UTS Semester Ganjil" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">Isi Pengumuman</label>
          <textarea name="isi" defaultValue={item?.isi ?? ""} rows={4} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="Detail informasi..." required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800">Target Role</label>
            <select name="targetRole" defaultValue={item?.target_role ?? "Semua"} className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-500">
              <option value="Semua">Semua Role</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-end">
             <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 w-full cursor-pointer">
                <input type="checkbox" name="isActive" defaultChecked={item?.is_active ?? true} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                <span className="text-sm font-medium text-slate-900">Tampilkan (Aktif)</span>
             </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white">Simpan Pengumuman</Button>
        </div>
      </form>
    </ModalShell>
  );
}

function DeleteForm({ id }: { id: string }) {
  const [state, formAction] = useActionState(deleteAnnouncementAction, initialState);
  useActionToast(state, "Pengumuman berhasil dihapus");

  return (
    <form action={formAction} className="inline-block">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm" className="h-11 w-11 sm:h-9 sm:w-9 p-0 text-rose-600 hover:bg-rose-50">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </form>
  );
}

export function AnnouncementsManager({ items }: { items: AnnouncementRow[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementRow | null>(null);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                <Megaphone className="h-5 w-5" />
             </div>
             <h3 className="text-xl font-semibold text-slate-900">Manajemen Pengumuman</h3>
          </div>
          <Button onClick={() => { setEditingItem(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Buat Pengumuman
          </Button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <Table>
            <THead><TR><TH>Pengumuman</TH><TH>Target</TH><TH>Status</TH><TH>Tanggal</TH><TH className="w-[120px]">Aksi</TH></TR></THead>
            <TBody>
              {items.length === 0 ? <TR><TD colSpan={5} className="py-10 text-center text-slate-500">Belum ada pengumuman</TD></TR> : items.map((item) => (
                <TR key={item.id}>
                  <TD className="max-w-md"><p className="font-semibold text-slate-900">{item.judul}</p><p className="line-clamp-1 text-xs text-slate-500">{item.isi}</p></TD>
                  <TD><Badge variant="outline">{item.target_role}</Badge></TD>
                  <TD><Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Aktif" : "Draft"}</Badge></TD>
                  <TD className="text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString('id-ID')}</TD>
                  <TD>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => { setEditingItem(item); setFormOpen(true); }} className="h-11 w-11 sm:h-9 sm:w-9 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
                      <DeleteForm id={item.id} />
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
      <AnnouncementFormModal open={formOpen} onClose={() => setFormOpen(false)} item={editingItem} />
    </div>
  );
}
