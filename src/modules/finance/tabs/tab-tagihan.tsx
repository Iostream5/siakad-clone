"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Download, Plus, Send, Pencil, Trash2, Search } from "lucide-react";

interface TabTagihanProps {
  filteredTagihan: any[];
  search: string;
  onSearchChange: (val: string) => void;
  onAddTagihan: () => void;
  onViewLedger: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TabTagihan({ 
  filteredTagihan, 
  search, 
  onSearchChange, 
  onAddTagihan, 
  onViewLedger, 
  onDelete 
}: TabTagihanProps) {
  return (
    <Card className="border-slate-100 shadow-sm rounded-none overflow-hidden bg-white min-h-[600px] animate-in fade-in duration-500">
      <div className="p-6 border-b-2 border-slate-50 bg-white flex items-center justify-between">
         <div className="flex items-center gap-4">
            <button className="text-[10px] font-black text-emerald-600 border-b-2 border-emerald-600 pb-2 uppercase tracking-widest">Daftar Tagihan</button>
            <p className="text-[10px] text-slate-400 font-bold mb-2 ml-4">Daftar penagihan pembayaran mahasiswa.</p>
         </div>
         <div className="flex gap-2">
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white h-10 px-4 font-black uppercase tracking-widest text-[9px] rounded-none shadow-lg"><Download className="h-3.5 w-3.5 mr-2" /> Import Tagihan</Button>
            <Button size="sm" onClick={onAddTagihan} className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-4 font-black uppercase tracking-widest text-[9px] rounded-none shadow-lg"><Plus className="h-3.5 w-3.5 mr-2" /> Buat Tagihan Baru</Button>
            <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-white h-10 px-4 font-black uppercase tracking-widest text-[9px] rounded-none shadow-lg"><Send className="h-3.5 w-3.5 mr-2" /> Kirim Notifikasi</Button>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white h-10 px-4 font-black uppercase tracking-widest text-[9px] rounded-none shadow-lg"><Pencil className="h-3.5 w-3.5 mr-2" /> Edit</Button>
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white h-10 px-4 font-black uppercase tracking-widest text-[9px] rounded-none shadow-lg"><Trash2 className="h-3.5 w-3.5 mr-2" /> Hapus</Button>
         </div>
      </div>
      
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
         <div className="flex items-center gap-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipe Pembayar :</label>
            <select className="h-10 border-2 border-slate-100 rounded-none px-4 text-[10px] font-black text-slate-700 outline-none focus:border-emerald-600 transition-all bg-white min-w-[200px]">
               <option>Semua Mahasiswa</option>
               <option>Mahasiswa Aktif</option>
               <option>Calon Mahasiswa (PMB)</option>
               <option>Alumni</option>
            </select>
         </div>
         <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Cari Nama atau NIM..." className="pl-10 h-10 rounded-none border-2 border-slate-100 bg-white font-bold text-[10px] focus:border-emerald-600" value={search} onChange={(e) => onSearchChange(e.target.value)} />
         </div>
      </div>

      <div className="p-0">
         <Table>
            <THead className="bg-slate-50/50">
               <TR>
                  <TH className="w-12 px-6"><input type="checkbox" className="accent-emerald-600" /></TH>
                  <TH className="text-[10px] text-center w-12">No</TH>
                  <TH className="text-[10px]">Nama / NIM</TH>
                  <TH className="text-[10px]">Nama Tagihan Pembayaran</TH>
                  <TH className="text-[10px]">Nominal</TH>
                  <TH className="text-[10px]">No / Tgl Invoice</TH>
                  <TH className="text-[10px]">Angsuran</TH>
                  <TH className="text-[10px]">Status</TH>
                  <TH className="text-[10px]">Tgl Dibuat</TH>
                  <TH className="text-right pr-6 text-[10px]">Aksi</TH>
               </TR>
            </THead>
            <TBody>
               {filteredTagihan.map((item, idx) => (
                 <TR key={item.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors group">
                    <TD className="px-6"><input type="checkbox" className="accent-emerald-600" /></TD>
                    <TD className="text-center text-[10px] font-bold text-slate-400">{idx + 1}</TD>
                    <TD>
                       <p className="font-black text-slate-900 text-[10px] uppercase">{item.mahasiswa?.users?.full_name}</p>
                       <p className="text-[9px] text-slate-400 font-mono tracking-tighter uppercase">{item.mahasiswa?.nim} / STAI / MPI</p>
                    </TD>
                    <TD>
                       <p className="text-[10px] font-black text-slate-700 uppercase">{item.jenis} ({item.mahasiswa?.nim}) - JUNE 2026</p>
                    </TD>
                    <TD className="font-mono font-black text-slate-900 text-[11px] whitespace-nowrap">{formatCurrency(item.nominal)}</TD>
                    <TD>
                       <p className="text-[9px] font-black text-cyan-700 uppercase tracking-tighter">INV{new Date(item.created_at).getTime().toString().slice(-10)}</p>
                       <p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(item.jatuh_tempo).toLocaleDateString('id-ID')}</p>
                    </TD>
                    <TD><p className="text-[9px] font-bold text-slate-500 uppercase">{item.mahasiswa?.boleh_angsur ? 'BOLEH' : 'TIDAK'}</p></TD>
                    <TD>
                       <Badge variant={item.status === 'Lunas' ? 'success' : 'destructive'} className="rounded-none text-[8px] font-black uppercase px-2 h-5 tracking-widest">
                          {item.status === 'Lunas' ? 'LUNAS' : 'BELUM LUNAS'}
                       </Badge>
                    </TD>
                    <TD><p className="text-[9px] font-bold text-slate-400">{new Date(item.created_at).toLocaleTimeString('id-ID')} {new Date(item.created_at).toLocaleDateString('id-ID')}</p></TD>
                    <TD className="pr-6">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="h-7 w-7 text-cyan-600 hover:bg-cyan-50 rounded-none" onClick={() => onViewLedger(item.mahasiswa_id)}><Search className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 text-rose-600 hover:bg-rose-50 rounded-none" onClick={() => onDelete(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                       </div>
                    </TD>
                 </TR>
               ))}
               {filteredTagihan.length === 0 && <TR><TD colSpan={10} className="py-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Tagihan Belum Dibuat</TD></TR>}
            </TBody>
         </Table>
      </div>
    </Card>
  );
}
