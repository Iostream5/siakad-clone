"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Plus, Calculator, ChevronRight, Zap, Trash2, Clock, BadgeInfo, Landmark, Banknote, Layers, FileText, Building2 } from "lucide-react";
import { useState } from "react";

interface TabSetupProps {
  masterBiayaList: any[];
  prodiList: any[];
  tahunAkademikList: any[];
  onAddMaster: () => void;
  onBulkTagihan: (id: string) => void;
  onDeleteMaster: (id: string) => void;
}

export default function TabSetup({ 
  masterBiayaList, 
  onAddMaster, 
  onBulkTagihan, 
  onDeleteMaster 
}: TabSetupProps) {
  const [setupSubTab, setSetupSubTab] = useState("tarif");

  const setupMenuItems = [
    { section: "Konfigurasi Utama", items: [
      { id: "periode-akademik", label: "Periode Akademik", icon: Clock },
      { id: "tarif", label: "Tarif Biaya Kuliah", icon: Calculator },
      { id: "potongan", label: "Master Beasiswa/Diskon", icon: BadgeInfo },
      { id: "api-bank", label: "Integrasi VA Bank", icon: Landmark },
      { id: "metode-bayar", label: "Metode Pembayaran", icon: Banknote },
      { id: "komponen", label: "Komponen Biaya", icon: Layers },
    ]},
    { section: "Master Data", items: [
      { id: "kode-akutansi", label: "COA (Buku Besar)", icon: FileText },
      { id: "akun-bank", label: "Daftar Rekening Kampus", icon: Building2 },
    ]}
  ];

  return (
    <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
       <div className="lg:col-span-3 space-y-6">
          <Card className="p-4 border-slate-100 shadow-sm bg-white rounded-none overflow-hidden">
             {setupMenuItems.map((section, idx) => (
               <div key={section.section} className={idx > 0 ? "mt-8" : ""}>
                  <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{section.section}</h4>
                  <nav className="space-y-1">
                     {section.items.map(item => (
                       <button 
                         key={item.id}
                         onClick={() => setSetupSubTab(item.id)}
                         className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-none transition-all ${setupSubTab === item.id ? "bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                       >
                         <div className="flex items-center gap-3">
                            <item.icon className={`h-4 w-4 ${setupSubTab === item.id ? "text-emerald-600" : "text-slate-400"}`} />
                            {item.label}
                         </div>
                         {setupSubTab === item.id && <ChevronRight className="h-4 w-4" />}
                       </button>
                     ))}
                  </nav>
               </div>
             ))}
          </Card>
       </div>

       <div className="lg:col-span-9 space-y-6">
          <Card className="border-slate-100 shadow-sm bg-white rounded-none overflow-hidden min-h-[600px]">
             <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div>
                   <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                      Master {setupMenuItems.flatMap(s => s.items).find(i => i.id === setupSubTab)?.label}
                   </h3>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Konfigurasi standar akademik STAI Al-Ittihad.</p>
                </div>
                {setupSubTab === "tarif" && (
                  <Button onClick={onAddMaster} className="bg-emerald-600 hover:bg-emerald-700 rounded-none h-10 px-6 font-black text-[10px] shadow-lg uppercase tracking-widest">
                     <Plus className="h-4 w-4 mr-2" /> Tambah Tarif Kuliah
                  </Button>
                )}
             </div>

             <div className="p-0 overflow-x-auto">
                {setupSubTab === "tarif" ? (
                  <Table>
                    <THead className="bg-slate-50/50">
                       <TR>
                          <TH className="pl-6 w-12 text-center text-[10px]">No</TH>
                          <TH className="text-[10px]">Tahun Akademik</TH>
                          <TH className="text-[10px]">Semester / Angkatan</TH>
                          <TH className="text-[10px]">Program Studi</TH>
                          <TH className="text-[10px]">Gelombang / Jalur PMB</TH>
                          <TH className="text-[10px]">Jenis Biaya</TH>
                          <TH className="text-[10px]">Nominal</TH>
                          <TH className="text-[10px] text-center">Status</TH>
                          <TH className="text-right pr-6 text-[10px]">Aksi</TH>
                       </TR>
                    </THead>
                    <TBody>
                       {masterBiayaList.map((mb, idx) => (
                         <TR key={mb.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                            <TD className="pl-6 text-center text-[10px] font-bold text-slate-400">{idx + 1}</TD>
                            <TD className="text-[10px] font-black text-slate-700 whitespace-nowrap">{mb.tahun_akademik?.nama || "Semua"}</TD>
                            <TD className="py-4">
                               <p className="text-[10px] font-black text-slate-900 uppercase">{(mb.tingkat_kelas || []).join(', ') || 'Semua Smt'}</p>
                               <p className="text-[9px] text-emerald-600 font-bold">Angk. {mb.angkatan || 'Semua'}</p>
                            </TD>
                            <TD>
                               <p className="text-[9px] font-bold text-slate-600 uppercase">{(mb.jurusan || []).join(', ') || 'Seluruh Prodi'}</p>
                            </TD>
                            <TD>
                               <p className="text-[9px] font-bold text-slate-800">{mb.gelombang || 'Semua'}</p>
                               <p className="text-[8px] text-slate-400 uppercase font-black">{mb.jalur || 'Semua Jalur'}</p>
                            </TD>
                            <TD>
                               <p className="text-[10px] font-black text-slate-900">{mb.nama}</p>
                            </TD>
                            <TD className="font-mono font-black text-slate-900 text-[11px] whitespace-nowrap">{formatCurrency(mb.nominal)}</TD>
                            <TD className="text-center">
                               <Badge variant={mb.status ? "success" : "secondary"} className="rounded-none text-[8px] font-black uppercase px-2 h-5">
                                  {mb.status ? 'Aktif' : 'Non-Aktif'}
                               </Badge>
                            </TD>
                            <TD className="pr-6">
                               <div className="flex justify-end items-center gap-2">
                                  <Button size="sm" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-none border border-transparent hover:border-emerald-100 transition-all" onClick={() => onBulkTagihan(mb.id)}><Zap className="h-4 w-4" /></Button>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-none border border-transparent hover:border-rose-100 transition-all" onClick={() => onDeleteMaster(mb.id)}><Trash2 className="h-4 w-4" /></Button>
                               </div>
                            </TD>
                         </TR>
                       ))}
                    </TBody>
                  </Table>
                ) : (
                  <div className="p-20 text-center space-y-4 font-black uppercase text-[10px]">Placeholder Modul {setupSubTab}</div>
                )}
             </div>
          </Card>
       </div>
    </div>
  );
}
