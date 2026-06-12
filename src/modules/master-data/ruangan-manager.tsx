"use client";

import { useState } from "react";
import { Pencil, Plus, Search, Trash2, X, RotateCcw, Save } from "lucide-react";

import { deleteGedungAction, upsertGedungAction, deleteRuanganAction, upsertRuanganAction } from "@/actions/ruangan";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function RuanganManager({ gedungs, ruanganData }: any) {
  const [activeTab, setActiveTab] = useState<"gedung" | "ruangan">("ruangan");
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);

  // Handle Reset Form
  const resetForm = () => setEditingItem(null);

  const filteredRuangan = ruanganData.items.filter((r: any) => 
     r.nama.toLowerCase().includes(search.toLowerCase()) || 
     r.kode.toLowerCase().includes(search.toLowerCase()) ||
     r.gedung?.nama?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGedung = gedungs.filter((g: any) =>
     g.nama.toLowerCase().includes(search.toLowerCase()) ||
     g.kode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
         <button 
           onClick={() => { setActiveTab("ruangan"); resetForm(); }} 
           className={`px-6 py-2 text-sm font-bold rounded-xl transition ${activeTab === "ruangan" ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
         >
           Manajemen Ruangan
         </button>
         <button 
           onClick={() => { setActiveTab("gedung"); resetForm(); }} 
           className={`px-6 py-2 text-sm font-bold rounded-xl transition ${activeTab === "gedung" ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
         >
           Manajemen Gedung
         </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        
        {/* KOLOM KIRI: FORM INPUT */}
        <div className="space-y-6">
          <Card className="sticky top-24 border-white/60 bg-white/80 backdrop-blur-md shadow-xl shadow-slate-200/50">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[linear-gradient(135deg,rgba(248,250,252,0.8),rgba(255,255,255,0.8))]">
               <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                     {editingItem ? <Pencil className="h-4 w-4 text-amber-500" /> : <Plus className="h-4 w-4 text-cyan-600" />}
                     {editingItem ? `Edit ${activeTab === 'gedung' ? 'Gedung' : 'Ruangan'}` : `Tambah ${activeTab === 'gedung' ? 'Gedung' : 'Ruangan'}`}
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Formulir Master Data</p>
               </div>
               {editingItem && (
                 <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 w-8 p-0 rounded-full hover:bg-slate-200">
                    <X className="h-4 w-4" />
                 </Button>
               )}
            </div>

            <div className="p-6">
               {activeTab === "gedung" ? (
                 <form action={upsertGedungAction} className="space-y-4">
                    <input type="hidden" name="id" value={editingItem?.id || ""} />
                    <div>
                       <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Kode Gedung</label>
                       <Input name="kode" key={editingItem?.id || 'new'} defaultValue={editingItem?.kode} placeholder="Contoh: G-A" required />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Nama Gedung</label>
                       <Input name="nama" key={editingItem?.id || 'new-name'} defaultValue={editingItem?.nama} placeholder="Gedung Utama" required />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Jumlah Lantai</label>
                       <Input name="jumlahLantai" type="number" key={editingItem?.id || 'new-floor'} defaultValue={editingItem?.jumlah_lantai || 1} required />
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                       <input type="checkbox" name="isAktif" id="isAktifG" defaultChecked={editingItem?.is_active ?? true} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                       <label htmlFor="isAktifG" className="text-sm font-medium text-slate-700 cursor-pointer">Gedung ini aktif</label>
                    </div>
                    <div className="pt-2 flex flex-col gap-2">
                       <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-100">
                          <Save className="mr-2 h-4 w-4" />
                          {editingItem ? "Update Gedung" : "Simpan Gedung"}
                       </Button>
                       {editingItem && (
                         <Button type="button" variant="secondary" onClick={resetForm} className="w-full">
                            <RotateCcw className="mr-2 h-4 w-4" /> Batal Edit
                         </Button>
                       )}
                    </div>
                 </form>
               ) : (
                 <form action={upsertRuanganAction} className="space-y-4">
                    <input type="hidden" name="id" value={editingItem?.id || ""} />
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Kode Ruang</label>
                          <Input name="kode" key={editingItem?.id || 'new-r'} defaultValue={editingItem?.kode} placeholder="R-101" required />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Nama Ruang</label>
                          <Input name="nama" key={editingItem?.id || 'new-rn'} defaultValue={editingItem?.nama} placeholder="Teori 1" required />
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Gedung</label>
                       <select name="gedungId" key={editingItem?.id || 'new-rg'} className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 outline-none" defaultValue={editingItem?.gedung_id || ""} required>
                          <option value="">Pilih Gedung</option>
                          {gedungs.map((g: any) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                       </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Lantai</label>
                          <Input name="lantai" type="number" key={editingItem?.id || 'new-rl'} defaultValue={editingItem?.lantai || 1} required />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Kapasitas</label>
                          <Input name="kapasitas" type="number" key={editingItem?.id || 'new-rk'} defaultValue={editingItem?.kapasitas || 40} required />
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Jenis Ruangan</label>
                       <select name="jenisRuangan" key={editingItem?.id || 'new-rj'} className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 outline-none" defaultValue={editingItem?.jenis_ruangan || "Teori"}>
                          <option value="Teori">Ruang Teori</option>
                          <option value="Laboratorium">Laboratorium</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Kantor">Kantor</option>
                       </select>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                       <input type="checkbox" name="isAktif" id="isAktifR" defaultChecked={editingItem?.is_active ?? true} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                       <label htmlFor="isAktifR" className="text-sm font-medium text-slate-700 cursor-pointer">Ruangan ini aktif</label>
                    </div>
                    <div className="pt-2 flex flex-col gap-2">
                       <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-100">
                          <Save className="mr-2 h-4 w-4" />
                          {editingItem ? "Update Ruangan" : "Simpan Ruangan"}
                       </Button>
                       {editingItem && (
                         <Button type="button" variant="secondary" onClick={resetForm} className="w-full">
                            <RotateCcw className="mr-2 h-4 w-4" /> Batal Edit
                         </Button>
                       )}
                    </div>
                 </form>
               )}
            </div>
          </Card>
        </div>

        {/* KOLOM KANAN: TABEL DATA */}
        <div className="flex-1 min-w-0">
          <Card className="overflow-hidden border-white/60 bg-white/80 backdrop-blur-md shadow-xl shadow-slate-200/50">
             <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div className="relative max-w-sm flex-1">
                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                   <Input 
                     placeholder={`Cari ${activeTab === 'ruangan' ? 'ruangan' : 'gedung'}...`} 
                     className="pl-10 h-9 bg-white border-slate-200" 
                     value={search} 
                     onChange={(e) => setSearch(e.target.value)} 
                   />
                </div>
                <div className="flex items-center gap-3 ml-4">
                   <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
                   <p className="text-xs font-medium text-slate-500 hidden md:block">
                      Total: <span className="text-slate-900">{activeTab === 'ruangan' ? filteredRuangan.length : filteredGedung.length}</span>
                   </p>
                </div>
             </div>

             <div className="overflow-x-auto">
                {activeTab === "ruangan" ? (
                   <Table>
                      <THead className="bg-slate-50/50">
                        <TR>
                          <TH className="text-[10px] uppercase tracking-wider">Info Ruangan</TH>
                          <TH className="text-[10px] uppercase tracking-wider">Lokasi</TH>
                          <TH className="text-[10px] uppercase tracking-wider">Detail</TH>
                          <TH className="text-[10px] uppercase tracking-wider">Status</TH>
                          <TH className="w-12"></TH>
                        </TR>
                      </THead>
                      <TBody>
                         {filteredRuangan.length === 0 ? (
                           <TR><TD colSpan={5} className="py-20 text-center text-slate-400 italic">Data tidak ditemukan</TD></TR>
                         ) : filteredRuangan.map((r: any) => (
                            <TR key={r.id} className={editingItem?.id === r.id ? 'bg-cyan-50/40 border-l-2 border-l-cyan-500' : ''}>
                               <TD><p className="font-bold text-slate-900 leading-tight">{r.nama}</p><p className="text-[10px] font-mono text-slate-400 mt-1">{r.kode}</p></TD>
                               <TD><p className="text-sm font-semibold text-slate-700">{r.gedung?.nama || "-"}</p><p className="text-[10px] text-slate-400">Lantai {r.lantai}</p></TD>
                               <TD>
                                  <div className="flex flex-col gap-1">
                                     <Badge variant="outline" className="w-fit text-[9px] px-1.5 py-0">{r.jenis_ruangan}</Badge>
                                     <span className="text-xs text-slate-600 font-medium">{r.kapasitas} Orang</span>
                                  </div>
                               </TD>
                               <TD><Badge variant={r.is_active ? "success" : "secondary"}>{r.is_active ? "Aktif" : "Nonaktif"}</Badge></TD>
                               <TD>
                                  <div className="flex gap-1">
                                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white hover:text-amber-600" onClick={() => setEditingItem({ ...r, type: "ruangan" })}><Pencil className="h-3.5 w-3.5" /></Button>
                                     <form action={deleteRuanganAction}><input type="hidden" name="id" value={r.id} /><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></Button></form>
                                  </div>
                               </TD>
                            </TR>
                         ))}
                      </TBody>
                   </Table>
                ) : (
                   <Table>
                      <THead className="bg-slate-50/50">
                        <TR>
                          <TH className="text-[10px] uppercase tracking-wider">Kode</TH>
                          <TH className="text-[10px] uppercase tracking-wider">Nama Gedung</TH>
                          <TH className="text-[10px] uppercase tracking-wider">Lantai</TH>
                          <TH className="text-[10px] uppercase tracking-wider">Status</TH>
                          <TH className="w-12"></TH>
                        </TR>
                      </THead>
                      <TBody>
                         {filteredGedung.length === 0 ? (
                           <TR><TD colSpan={5} className="py-20 text-center text-slate-400 italic">Data tidak ditemukan</TD></TR>
                         ) : gedungs.map((g: any) => (
                            <TR key={g.id} className={editingItem?.id === g.id ? 'bg-cyan-50/40 border-l-2 border-l-cyan-500' : ''}>
                               <TD className="font-mono text-xs text-slate-500">{g.kode}</TD>
                               <TD className="font-bold text-slate-900">{g.nama}</TD>
                               <TD className="text-sm font-medium text-slate-600">{g.jumlah_lantai} Lantai</TD>
                               <TD><Badge variant={g.is_active ? "success" : "secondary"}>{g.is_active ? "Aktif" : "Nonaktif"}</Badge></TD>
                               <TD>
                                  <div className="flex gap-1">
                                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white hover:text-amber-600" onClick={() => setEditingItem({ ...g, type: "gedung" })}><Pencil className="h-3.5 w-3.5" /></Button>
                                     <form action={deleteGedungAction}><input type="hidden" name="id" value={g.id} /><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></Button></form>
                                  </div>
                               </TD>
                            </TR>
                         ))}
                      </TBody>
                   </Table>
                )}
             </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
