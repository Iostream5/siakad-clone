"use client";

import { useActionState, useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Clock, Send, ShieldCheck, XCircle, UserCheck, Eye, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { submitKrsAction, approveKrsAction } from "@/actions/krs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const initialState = { success: false, message: null };

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
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900">X</button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

function ApproveKrsModal({ open, onClose, item }: any) {
  const router = useRouter();
  const [state, formAction] = useActionState(approveKrsAction as any, initialState);

  useEffect(() => { if (state?.success) { onClose(); router.refresh(); } }, [onClose, router, state?.success]);

  if (!item) return null;

  return (
    <ModalShell open={open} onClose={onClose} title="Validasi KRS" description="Tinjau dan beri persetujuan pada KRS mahasiswa">
       <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-xs text-slate-500 uppercase">Mahasiswa</p>
                   <p className="font-bold text-slate-900">{item.mahasiswa?.users?.full_name}</p>
                </div>
                <div>
                   <p className="text-xs text-slate-500 uppercase">NIM / Prodi</p>
                   <p className="font-medium text-slate-700">{item.mahasiswa?.nim} - {item.mahasiswa?.program_studi?.nama}</p>
                </div>
             </div>
          </div>

          <div className="max-h-60 overflow-y-auto border rounded-xl">
             <Table>
                <THead><TR><TH>Kode</TH><TH>Mata Kuliah</TH><TH>SKS</TH></TR></THead>
                <TBody>
                   {/* We might need to fetch details for this student if not provided in item */}
                   <TR><TD colSpan={3} className="text-center text-xs py-4 text-slate-400 italic">Total SKS yang diajukan: {item.total_sks} SKS</TD></TR>
                </TBody>
             </Table>
          </div>

          <form action={formAction} className="space-y-4 pt-4 border-t">
             <input type="hidden" name="krsId" value={item.id} />
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Dosen Wali (Opsional)</label>
                <Input name="catatan" placeholder="Beri catatan jika ada perubahan atau penolakan..." />
             </div>
             <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
                <button name="status" value="Ditolak" className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 font-semibold hover:bg-rose-100 transition">Tolak</button>
                <button name="status" value="Disetujui" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition">Setujui KRS</button>
             </div>
          </form>
       </div>
    </ModalShell>
  );
}

export function KrsManager({ 
  availableJadwal, 
  currentKrs, 
  user,
  tahunAkademik,
  submissions = []
}: any) {
  const [selectedJadwal, setSelectedJadwal] = useState<string[]>(
    currentKrs?.krs_detail?.map((d: any) => d.jadwal.id) || []
  );
  const [search, setSearch] = useState("");
  const [validatingItem, setValidatingItem] = useState(null);

  const toggleJadwal = (id: string) => {
    if (currentKrs?.status === "Disetujui") return;
    setSelectedJadwal(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const totalSks = availableJadwal
    .filter((j: any) => selectedJadwal.includes(j.id))
    .reduce((acc: number, curr: any) => acc + (curr.mata_kuliah?.sks || 0), 0);

  if (user.role === "Mahasiswa") {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
           <Card className="p-4 bg-white border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tahun Akademik</p>
              <p className="mt-1 font-bold text-slate-900">{tahunAkademik?.nama}</p>
           </Card>
           <Card className="p-4 bg-white border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status KRS</p>
              <div className="mt-1">
                 <Badge variant={
                   currentKrs?.status === "Disetujui" ? "success" :
                   currentKrs?.status === "Diajukan" ? "secondary" : "outline"
                 }>
                    {currentKrs?.status?.toUpperCase() || "BELUM ISI"}
                 </Badge>
              </div>
           </Card>
           <Card className="p-4 bg-white border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Beban SKS</p>
              <p className="mt-1 font-bold text-slate-900">{totalSks} / 24 SKS</p>
           </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-cyan-600" />
                Pilih Mata Kuliah
             </h3>
             {currentKrs?.status !== "Disetujui" && (
                <form action={submitKrsAction.bind(null, user.mahasiswaId, tahunAkademik.id)}>
                   {selectedJadwal.map(id => (
                     <input key={id} type="hidden" name="jadwalIds" value={id} />
                   ))}
                   <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-100">
                      <Send className="mr-2 h-4 w-4" /> Ajukan KRS
                   </Button>
                </form>
             )}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH className="w-12"></TH>
                  <TH>Mata Kuliah</TH>
                  <TH>SKS</TH>
                  <TH>Dosen</TH>
                  <TH>Jadwal</TH>
                  <TH>Kuota</TH>
                </TR>
              </THead>
              <TBody>
                {availableJadwal.map((item: any) => (
                  <TR 
                    key={item.id} 
                    className={`cursor-pointer transition-colors ${selectedJadwal.includes(item.id) ? 'bg-cyan-50/50' : ''}`}
                    onClick={() => toggleJadwal(item.id)}
                  >
                    <TD>
                       <input 
                         type="checkbox" 
                         checked={selectedJadwal.includes(item.id)}
                         readOnly
                         className="h-4 w-4 rounded border-slate-300 text-cyan-600"
                       />
                    </TD>
                    <TD>
                      <p className="font-semibold text-slate-900">{item.mata_kuliah?.nama}</p>
                      <p className="text-xs text-slate-500">{item.mata_kuliah?.kode}</p>
                    </TD>
                    <TD className="text-sm font-medium">{item.mata_kuliah?.sks} SKS</TD>
                    <TD className="text-sm text-slate-600">{item.dosen?.users?.full_name}</TD>
                    <TD className="text-xs">
                       <p className="font-medium text-slate-700">{item.hari}</p>
                       <p className="text-slate-500">{item.jam_mulai} - {item.jam_selesai}</p>
                       <p className="text-slate-400">R: {item.ruangan}</p>
                    </TD>
                    <TD className="text-xs font-mono">
                       {item.peserta} / {item.kapasitas}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>
      </div>
    );
  }

  // View for Admin / Dosen
  const filteredSubmissions = submissions.filter((s: any) => 
    s.mahasiswa?.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.mahasiswa?.nim?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <UserCheck className="h-5 w-5" />
             </div>
             <h3 className="text-xl font-semibold text-slate-900">Persetujuan KRS</h3>
          </div>
          <div className="relative w-full max-w-sm">
             <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
             <Input placeholder="Cari mahasiswa..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
       </div>

       <Card className="overflow-hidden">
          <Table>
             <THead><TR><TH>Mahasiswa</TH><TH>Program Studi</TH><TH>Total SKS</TH><TH>Status</TH><TH>Update Terakhir</TH><TH className="w-12">Aksi</TH></TR></THead>
             <TBody>
                {filteredSubmissions.length === 0 ? (
                  <TR><TD colSpan={6} className="py-10 text-center text-slate-500 italic">Belum ada pengajuan KRS</TD></TR>
                ) : filteredSubmissions.map((item: any) => (
                  <TR key={item.id}>
                    <TD><p className="font-semibold text-slate-900">{item.mahasiswa?.users?.full_name}</p><p className="text-xs text-slate-500">{item.mahasiswa?.nim}</p></TD>
                    <TD className="text-sm">{item.mahasiswa?.program_studi?.nama}</TD>
                    <TD className="text-sm font-bold text-slate-700">{item.total_sks} SKS</TD>
                    <TD>
                       <Badge variant={item.status === "Disetujui" ? "success" : item.status === "Diajukan" ? "secondary" : "destructive"}>
                          {item.status}
                       </Badge>
                    </TD>
                    <TD className="text-xs text-slate-500">{new Date(item.updated_at).toLocaleString('id-ID')}</TD>
                    <TD>
                       <Button variant="secondary" size="sm" className="h-8 w-8 p-0" onClick={() => setValidatingItem(item)}>
                          <Eye className="h-4 w-4" />
                       </Button>
                    </TD>
                  </TR>
                ))}
             </TBody>
          </Table>
       </Card>

       <ApproveKrsModal open={Boolean(validatingItem)} onClose={() => setValidatingItem(null)} item={validatingItem} />
    </div>
  );
}
