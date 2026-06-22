"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Bell, ClockAlert, Edit3, Plus, Search, Trash2, Upload } from "lucide-react";

type TagihanItem = {
  id: string;
  mahasiswa_id: string;
  tahun_akademik_id?: string;
  jenis: string;
  nominal: number | string;
  jatuh_tempo: string;
  status: string;
  created_at: string;
  mahasiswa?: {
    nim?: string | null;
    boleh_angsur?: boolean | null;
    users?: {
      full_name?: string | null;
    } | null;
  } | null;
};

interface TabTagihanProps {
  filteredTagihan: TagihanItem[];
  selectedIds: string[];
  search: string;
  onSearchChange: (val: string) => void;
  onSelectionChange: (ids: string[]) => void;
  onAddTagihan: () => void;
  onImportTagihan: () => void;
  onEditSelected: () => void;
  onDeleteSelected: () => void;
  onNotifySelected: () => void;
  onNotifyOverdue: () => void;
  onViewLedger: (id: string) => void;
  canCreateTagihan: boolean;
  canMutateTagihan: boolean;
}

function getStatusVariant(status: string): "success" | "secondary" | "destructive" {
  if (status === "Lunas") return "success";
  if (status === "Dispensasi") return "secondary";
  return "destructive";
}

export default function TabTagihan({
  filteredTagihan,
  selectedIds,
  search,
  onSearchChange,
  onSelectionChange,
  onAddTagihan,
  onImportTagihan,
  onEditSelected,
  onDeleteSelected,
  onNotifySelected,
  onNotifyOverdue,
  onViewLedger,
  canCreateTagihan,
  canMutateTagihan,
}: TabTagihanProps) {
  const visibleIds = filteredTagihan.map((item) => item.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      onSelectionChange(selectedIds.filter((id) => !visibleIds.includes(id)));
      return;
    }
    onSelectionChange(Array.from(new Set([...selectedIds, ...visibleIds])));
  };

  const toggleOne = (id: string) => {
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };

  return (
    <Card className="min-h-[600px] overflow-hidden rounded-none border-slate-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b-2 border-slate-50 bg-white p-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <button className="border-b-2 border-emerald-600 pb-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
            Daftar Tagihan
          </button>
          <p className="ml-4 text-[10px] font-bold text-slate-400">Daftar penagihan pembayaran mahasiswa.</p>
        </div>
        {canMutateTagihan ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onImportTagihan} className="h-10 rounded-none px-3 text-[9px] font-black uppercase tracking-widest">
              <Upload className="mr-2 h-3.5 w-3.5" /> Import Tagihan
            </Button>
            <Button size="sm" variant="outline" onClick={onNotifySelected} disabled={selectedIds.length === 0} className="h-10 rounded-none px-3 text-[9px] font-black uppercase tracking-widest">
              <Bell className="mr-2 h-3.5 w-3.5" /> Kirim Notifikasi
            </Button>
            <Button size="sm" variant="outline" onClick={onNotifyOverdue} className="h-10 rounded-none px-3 text-[9px] font-black uppercase tracking-widest">
              <ClockAlert className="mr-2 h-3.5 w-3.5" /> Overdue
            </Button>
            <Button size="sm" variant="outline" onClick={onEditSelected} disabled={selectedIds.length !== 1} className="h-10 rounded-none px-3 text-[9px] font-black uppercase tracking-widest">
              <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit
            </Button>
            <Button size="sm" variant="outline" onClick={onDeleteSelected} disabled={selectedIds.length === 0} className="h-10 rounded-none border-rose-200 px-3 text-[9px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50">
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus
            </Button>
            {canCreateTagihan ? (
              <Button size="sm" onClick={onAddTagihan} className="h-10 rounded-none bg-emerald-600 px-4 text-[9px] font-black uppercase tracking-widest text-white shadow-lg hover:bg-emerald-700">
                <Plus className="mr-2 h-3.5 w-3.5" /> Buat Tagihan Baru
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-slate-50 bg-slate-50/20 p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {selectedIds.length} dipilih
        </p>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Cari Nama atau NIM..." className="h-10 rounded-none border-2 border-slate-100 bg-white pl-10 text-[10px] font-bold focus:border-emerald-600" value={search} onChange={(e) => onSearchChange(e.target.value)} />
        </div>
      </div>

      <Table>
        <THead className="bg-slate-50/50">
          <TR>
            {canMutateTagihan ? (
              <TH className="w-10 text-center text-[10px]">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Pilih semua tagihan terlihat" />
              </TH>
            ) : null}
            <TH className="w-12 text-center text-[10px]">No</TH>
            <TH className="text-[10px]">Nama / NIM</TH>
            <TH className="text-[10px]">Nama Tagihan Pembayaran</TH>
            <TH className="text-[10px]">Nominal</TH>
            <TH className="text-[10px]">No / Tgl Invoice</TH>
            <TH className="text-[10px]">Angsuran</TH>
            <TH className="text-[10px]">Status</TH>
            <TH className="text-[10px]">Tgl Dibuat</TH>
            <TH className="pr-6 text-right text-[10px]">Aksi</TH>
          </TR>
        </THead>
        <TBody>
          {filteredTagihan.map((item, idx) => (
            <TR key={item.id} className="group border-b border-slate-50 transition-colors hover:bg-slate-50/50">
              {canMutateTagihan ? (
                <TD className="text-center">
                  <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleOne(item.id)} aria-label={`Pilih tagihan ${item.jenis}`} />
                </TD>
              ) : null}
              <TD className="text-center text-[10px] font-bold text-slate-400">{idx + 1}</TD>
              <TD>
                <p className="text-[10px] font-black uppercase text-slate-900">{item.mahasiswa?.users?.full_name || "Mahasiswa"}</p>
                <p className="font-mono text-[9px] uppercase tracking-tighter text-slate-400">{item.mahasiswa?.nim ?? "-"}</p>
              </TD>
              <TD>
                <p className="text-[10px] font-black uppercase text-slate-700">{item.jenis}</p>
              </TD>
              <TD className="whitespace-nowrap font-mono text-[11px] font-black text-slate-900">{formatCurrency(Number(item.nominal))}</TD>
              <TD>
                <p className="text-[9px] font-black uppercase tracking-tighter text-cyan-700">INV{new Date(item.created_at).getTime().toString().slice(-10)}</p>
                <p className="text-[8px] font-bold uppercase text-slate-400">{new Date(item.jatuh_tempo).toLocaleDateString("id-ID")}</p>
              </TD>
              <TD><p className="text-[9px] font-bold uppercase text-slate-500">{item.mahasiswa?.boleh_angsur ? "Boleh" : "Tidak"}</p></TD>
              <TD>
                <Badge variant={getStatusVariant(item.status)} className="h-5 rounded-none px-2 text-[8px] font-black uppercase tracking-widest">
                  {item.status}
                </Badge>
              </TD>
              <TD><p className="text-[9px] font-bold text-slate-400">{new Date(item.created_at).toLocaleTimeString("id-ID")} {new Date(item.created_at).toLocaleDateString("id-ID")}</p></TD>
              <TD className="pr-6">
                <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="sm" variant="ghost" className="h-7 w-7 rounded-none text-cyan-600 hover:bg-cyan-50" onClick={() => onViewLedger(item.mahasiswa_id)}>
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TD>
            </TR>
          ))}
          {filteredTagihan.length === 0 && (
            <TR>
              <TD colSpan={canMutateTagihan ? 10 : 9} className="py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                Tagihan Belum Dibuat
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </Card>
  );
}
