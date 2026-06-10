"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { FileText, ChevronRight } from "lucide-react";

interface TabPembayaranProps {
  pembayaran: any[];
  mahasiswaList: any[];
  onViewLedger: (id: string) => void;
  onVerify: (formData: FormData) => void;
  verifyAction: (id: string, status: string) => void;
}

export default function TabPembayaran({ 
  pembayaran, 
  mahasiswaList, 
  onViewLedger, 
  verifyAction 
}: TabPembayaranProps) {
  return (
    <Card className="border-slate-100 shadow-sm rounded-none overflow-hidden bg-white min-h-[600px] animate-in fade-in duration-500">
       <div className="p-6 border-b border-slate-50 bg-white flex items-center gap-12">
          <button className="text-[10px] font-black text-emerald-600 border-b-2 border-emerald-600 pb-2 uppercase tracking-widest">Pembayaran Mahasiswa</button>
          <button className="text-[10px] font-black text-slate-400 pb-2 uppercase tracking-widest hover:text-slate-900 transition-colors">Pembayaran Calon Mahasiswa</button>
          <button className="text-[10px] font-black text-slate-400 pb-2 uppercase tracking-widest hover:text-slate-900 transition-colors">Riwayat Transaksi Penerimaan</button>
       </div>
       <div className="p-12 text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-6">
             <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b pb-2 inline-block px-12 border-emerald-600">Cari Mahasiswa</h4>
             <div className="relative">
                <select 
                  className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-none px-6 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  onChange={(e) => e.target.value && onViewLedger(e.target.value)}
                >
                   <option value="">Ketik nama Mahasiswa atau NIM...</option>
                   {mahasiswaList.map(m => <option key={m.id} value={m.id}>{m.nim} - {m.users?.full_name}</option>)}
                </select>
                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 rotate-90" />
             </div>
          </div>
       </div>
       
       <div className="p-0 border-t border-slate-50">
          <Table>
             <THead className="bg-slate-50/50"><TR><TH className="pl-6 text-[10px]">Mahasiswa & Bukti</TH><TH className="text-[10px]">Nominal</TH><TH className="text-[10px]">Status</TH><TH className="text-right pr-6 text-[10px]">Verifikasi</TH></TR></THead>
             <TBody>
                {pembayaran.map(item => (
                  <TR key={item.id} className="hover:bg-slate-50/50 border-b border-slate-50">
                     <TD className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 bg-slate-100 flex items-center justify-center rounded-none border border-slate-200"><FileText className="h-5 w-5 text-slate-400" /></div>
                           <div><p className="font-black text-slate-900 text-xs">{item.tagihan?.mahasiswa?.users?.full_name}</p><div className="flex items-center gap-2 mt-1"><span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">{item.metode}</span><a href={item.bukti_url} target="_blank" className="text-[9px] text-cyan-600 font-black hover:underline uppercase tracking-widest">Lihat Bukti</a></div></div>
                        </div>
                     </TD>
                     <TD className="font-mono font-black text-emerald-600 text-xs">{formatCurrency(item.nominal)}</TD>
                     <TD><Badge variant={item.status === 'Terverifikasi' ? 'success' : 'outline'} className="rounded-none text-[8px] font-black uppercase px-3 h-5">{item.status}</Badge></TD>
                     <TD className="pr-6">
                        {item.status === "Menunggu" && (
                           <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => verifyAction(item.id, "Terverifikasi")} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-[8px] font-black px-4 shadow-lg shadow-emerald-100 uppercase">Terima</Button>
                              <Button size="sm" variant="outline" onClick={() => verifyAction(item.id, "Ditolak")} className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-none text-[8px] font-black px-4 uppercase">Tolak</Button>
                           </div>
                        )}
                     </TD>
                  </TR>
                ))}
             </TBody>
          </Table>
       </div>
    </Card>
  );
}
