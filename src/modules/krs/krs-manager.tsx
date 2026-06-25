"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { BookOpen, Search, UserCheck, Eye, Send, AlertCircle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { approveKrsAction, assignDosenWaliAction, submitKrsAction } from "@/actions/krs";
import type { DosenWaliCandidate, JadwalRow, KrsSubmitEligibility } from "@/lib/admin/krs";
import type { KrsSubmissionItem } from "@/types/domain";

type MaybeArray<T> = T | T[] | null | undefined;

type KrsRelationObject<T> = T extends Array<infer U> ? U : NonNullable<T>;

type KrsSubmissionMahasiswa = KrsRelationObject<KrsSubmissionItem["mahasiswa"]>;

type CurrentKrs = {
  id: string;
  status: string;
  total_sks: number | null;
  krs_detail?: Array<{
    jadwal: MaybeArray<{ id: string }>;
  }> | null;
} | null;

type KrsPageUser = {
  role: string;
  mahasiswaId?: string | null;
};

type TahunAkademik = {
  id: string;
  nama?: string | null;
};

type KrsManagerProps = {
  availableJadwal: JadwalRow[];
  currentKrs: CurrentKrs;
  user: KrsPageUser;
  tahunAkademik: TahunAkademik;
  submissions?: KrsSubmissionItem[];
  krsEligibility?: KrsSubmitEligibility | null;
  dosenWaliCandidates?: DosenWaliCandidate[];
};

type ModalShellProps = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
};

type ApproveKrsModalProps = {
  open: boolean;
  onClose: () => void;
  item: KrsSubmissionItem | null;
};

function firstRelation<T>(value: MaybeArray<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getSubmissionMahasiswa(item: KrsSubmissionItem | null) {
  return firstRelation(item?.mahasiswa as MaybeArray<KrsSubmissionMahasiswa>);
}

function getAdvisorName(item: KrsSubmissionItem) {
  const advisor = firstRelation(item.dosen_wali?.dosen);
  const profile = firstRelation(advisor?.users);
  return profile?.full_name ?? null;
}

function AssignDosenWaliForm({
  item,
  candidates,
}: {
  item: KrsSubmissionItem;
  candidates: DosenWaliCandidate[];
}) {
  const mahasiswa = getSubmissionMahasiswa(item);
  const currentDosenId = item.dosen_wali?.id_dosen ?? "";
  const prodiCandidates = candidates.filter((candidate) => !mahasiswa?.prodi_id || candidate.prodi_id === mahasiswa.prodi_id);

  if (!mahasiswa) return <span className="text-xs text-slate-400">Data mahasiswa tidak lengkap</span>;
  if (prodiCandidates.length === 0) return <span className="text-xs font-semibold text-amber-600">Belum ada kandidat dosen wali</span>;

  return (
    <form action={assignDosenWaliAction} className="flex min-w-56 items-center gap-2">
      <input type="hidden" name="mahasiswaId" value={mahasiswa.id} />
      <select
        name="dosenId"
        defaultValue={currentDosenId}
        className="h-9 min-w-40 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
      >
        <option value="">Pilih dosen</option>
        {prodiCandidates.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>{candidate.full_name}</option>
        ))}
      </select>
      <Button type="submit" variant="secondary" size="sm" className="h-9 px-3 text-xs">Simpan</Button>
    </form>
  );
}

function ModalShell({ open, title, description, onClose, children }: ModalShellProps) {
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

function ApproveKrsModal({ open, onClose, item }: ApproveKrsModalProps) {
  if (!item) return null;

  const mahasiswa = getSubmissionMahasiswa(item);
  const profile = firstRelation(mahasiswa?.users);
  const prodi = firstRelation(mahasiswa?.program_studi);
  const details = item.krs_detail ?? [];
  const canProcess = item.status === "Diajukan";

  return (
    <ModalShell
       open={open}
       onClose={onClose}
       title="Validasi KRS"
       description="Tinjau dan beri persetujuan pada KRS mahasiswa">
       <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-xs text-slate-500 uppercase">Mahasiswa</p>
                   <p className="font-bold text-slate-900">{profile?.full_name ?? "-"}</p>
                </div>
                <div>
                   <p className="text-xs text-slate-500 uppercase">NIM / Prodi</p>
                   <p className="font-medium text-slate-700">{mahasiswa?.nim ?? "-"} - {prodi?.nama ?? "-"}</p>
                </div>
             </div>
          </div>

          <div className="max-h-60 overflow-y-auto border rounded-xl">
             <Table>
                <THead><TR><TH>Kode</TH><TH>Mata Kuliah</TH><TH>Jadwal</TH><TH>Dosen</TH><TH>SKS</TH></TR></THead>
                <TBody>
                  {details.map((detail) => {
                    const jadwal = firstRelation(detail.jadwal);
                    const mataKuliah = firstRelation(jadwal?.mata_kuliah);
                    const dosen = firstRelation(jadwal?.dosen);
                    const dosenProfile = firstRelation(dosen?.users);

                    return (
                      <TR key={detail.id}>
                        <TD className="text-xs font-bold">{mataKuliah?.kode ?? "-"}</TD>
                        <TD className="text-sm font-medium text-slate-800">{mataKuliah?.nama ?? "-"}</TD>
                        <TD className="text-xs text-slate-600">{jadwal ? `${jadwal.hari}, ${jadwal.jam_mulai} - ${jadwal.jam_selesai}` : "-"}</TD>
                        <TD className="text-xs text-slate-600">{dosenProfile?.full_name ?? "-"}</TD>
                        <TD className="text-sm font-bold">{mataKuliah?.sks ?? 0}</TD>
                      </TR>
                    );
                  })}
                  <TR>
                    <TD colSpan={5} className="text-center text-xs py-4 text-slate-400 italic">
                      Total SKS yang diajukan: {item.total_sks} SKS
                    </TD>
                  </TR>
                </TBody>
             </Table>
          </div>

          {!canProcess ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-600">
              KRS ini sudah berstatus {item.status} dan tidak bisa diproses ulang tanpa revisi mahasiswa.
            </div>
          ) : null}

          <form action={approveKrsAction} className="space-y-4 pt-4 border-t">
             <input type="hidden" name="krsId" value={item.id} />
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Dosen Wali (Opsional)</label>
                <Input name="catatan" placeholder="Beri catatan jika ada perubahan atau penolakan..." />
             </div>
             <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
                <button name="status" value="Ditolak" disabled={!canProcess} className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 font-semibold hover:bg-rose-100 transition disabled:cursor-not-allowed disabled:opacity-50">Tolak</button>
                <button name="status" value="Disetujui" disabled={!canProcess} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:cursor-not-allowed disabled:opacity-50">Setujui KRS</button>
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
  submissions = [],
  krsEligibility = null,
  dosenWaliCandidates = []
}: KrsManagerProps) {
  const [selectedJadwal, setSelectedJadwal] = useState<string[]>(
    currentKrs?.krs_detail
      ?.map((detail) => firstRelation(detail.jadwal)?.id)
      .filter((id): id is string => Boolean(id)) ?? []
  );
  const [search, setSearch] = useState("");
  const [validatingItem, setValidatingItem] = useState<KrsSubmissionItem | null>(null);

  const canEditKrs = user.role !== "Mahasiswa" || Boolean(krsEligibility?.allowed);
  const krsLockReason = krsEligibility?.reason ?? "KRS belum bisa diajukan.";

  const toggleJadwal = (id: string, isDisabled: boolean) => {
    if (currentKrs?.status === "Disetujui" || isDisabled || !canEditKrs) return;
    setSelectedJadwal(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const totalSks = availableJadwal
    .filter((jadwal) => selectedJadwal.includes(jadwal.id))
    .reduce((acc, curr) => acc + (curr.mata_kuliah?.sks || 0), 0);

  const maxSks = 24; // This could come from user data/GPA
  const mahasiswaIdForSubmit = user.mahasiswaId ?? "";

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
              <p className={`mt-1 font-bold ${totalSks > maxSks ? 'text-rose-600' : 'text-slate-900'}`}>
                 {totalSks} / {maxSks} SKS
              </p>
           </Card>
        </div>

        {!canEditKrs && currentKrs?.status !== "Disetujui" && (
           <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">KRS belum bisa diajukan</p>
                <p className="mt-1 text-sm">{krsLockReason}</p>
              </div>
           </div>
        )}

        {totalSks > maxSks && (
           <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">Total SKS Anda melebihi batas maksimal yang diizinkan. Silakan kurangi beberapa mata kuliah.</p>
           </div>
        )}

        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-cyan-600" />
                Pilih Mata Kuliah
             </h3>
             {currentKrs?.status !== "Disetujui" && (
                <form action={submitKrsAction.bind(null, mahasiswaIdForSubmit, tahunAkademik.id)}>
                   {selectedJadwal.map(id => (
                     <input key={id} type="hidden" name="jadwalIds" value={id} />
                   ))}
                   <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-100" disabled={!mahasiswaIdForSubmit || !canEditKrs || totalSks > maxSks || selectedJadwal.length === 0}>
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
                {availableJadwal.map((item) => {
                  const isSelected = selectedJadwal.includes(item.id);
                  const isFull = item.peserta >= item.kapasitas;
                  const isDisabled = !canEditKrs || (isFull && !isSelected) || currentKrs?.status === "Disetujui";

                  return (
                      <TR
                        key={item.id}
                        className={`transition-colors ${isSelected ? 'bg-cyan-50/50' : ''} ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`}
                        onClick={() => toggleJadwal(item.id, isDisabled)}
                      >
                        <TD>
                           <input
                             type="checkbox"
                             checked={isSelected}
                             disabled={isDisabled}
                             onChange={() => {}}
                             className="h-4 w-4 rounded border-slate-300 text-cyan-600"
                           />
                        </TD>
                        <TD>
                          <p className="font-semibold text-slate-900">{item.mata_kuliah?.nama}</p>
                          <p className="text-xs text-slate-500">{item.mata_kuliah?.kode} {item.mata_kuliah?.prasyarat_mk_id && <span className="ml-2 text-[10px] text-amber-600 font-medium px-1 bg-amber-50 rounded">Ada Prasyarat</span>}</p>
                        </TD>
                        <TD className="text-sm font-medium">{item.mata_kuliah?.sks} SKS</TD>
                        <TD className="text-sm text-slate-600">{item.dosen?.users?.full_name}</TD>
                        <TD className="text-xs">
                           <p className="font-medium text-slate-700">{item.hari}</p>
                           <p className="text-slate-500">{item.jam_mulai} - {item.jam_selesai}</p>
                           <p className="text-slate-400">R: {item.ruangan}</p>
                        </TD>
                        <TD className="text-xs font-mono">
                           <span className={isFull ? "text-rose-600 font-bold" : ""}>
                             {item.peserta} / {item.kapasitas}
                           </span>
                           {isFull && <p className="text-[10px] text-rose-500">Penuh</p>}
                        </TD>
                      </TR>
                  )
                })}
                {availableJadwal.length === 0 ? (
                  <TR>
                    <TD colSpan={6} className="py-10 text-center text-slate-500 italic">
                      Jadwal kuliah belum tersedia untuk tahun akademik aktif.
                    </TD>
                  </TR>
                ) : null}
              </TBody>
            </Table>
          </div>
        </Card>
      </div>
    );
  }

  // View for Admin / Prodi / Dosen
  const searchKeyword = search.trim().toLowerCase();
  const canManageAdvisor = user.role === "Admin" || user.role === "Prodi";
  const filteredSubmissions = submissions.filter((submission) => {
    const mahasiswa = getSubmissionMahasiswa(submission);
    const profile = firstRelation(mahasiswa?.users);
    const nama = profile?.full_name?.toLowerCase() ?? "";
    const nim = mahasiswa?.nim?.toLowerCase() ?? "";

    return nama.includes(searchKeyword) || nim.includes(searchKeyword);
  });

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
             <THead><TR><TH>Mahasiswa</TH><TH>Program Studi</TH><TH>Dosen Wali</TH><TH>Total SKS</TH><TH>Status</TH><TH>Update Terakhir</TH><TH className="w-12">Aksi</TH></TR></THead>
             <TBody>
                {filteredSubmissions.length === 0 ? (
                  <TR><TD colSpan={7} className="py-10 text-center text-slate-500 italic">Belum ada pengajuan KRS</TD></TR>
                ) : filteredSubmissions.map((item) => {
                  const mahasiswa = getSubmissionMahasiswa(item);
                  const profile = firstRelation(mahasiswa?.users);
                  const prodi = firstRelation(mahasiswa?.program_studi);
                  const advisorName = getAdvisorName(item);

                  return (
                    <TR key={item.id}>
                      <TD><p className="font-semibold text-slate-900">{profile?.full_name ?? "-"}</p><p className="text-xs text-slate-500">{mahasiswa?.nim ?? "-"}</p></TD>
                      <TD className="text-sm">{prodi?.nama ?? "-"}</TD>
                      <TD>
                        {canManageAdvisor ? (
                          <AssignDosenWaliForm item={item} candidates={dosenWaliCandidates} />
                        ) : (
                          <span className={advisorName ? "text-sm font-medium text-slate-700" : "text-xs font-semibold text-amber-600"}>
                            {advisorName ?? "Belum ada dosen wali"}
                          </span>
                        )}
                      </TD>
                      <TD className="text-sm font-bold text-slate-700">{item.total_sks} SKS</TD>
                      <TD>
                         <Badge variant={item.status === "Disetujui" ? "success" : item.status === "Diajukan" ? "secondary" : "destructive"}>
                            {item.status}
                         </Badge>
                      </TD>
                      <TD className="text-xs text-slate-500">{new Date(item.updated_at).toLocaleString('id-ID')}</TD>
                      <TD>
                         <Button variant="secondary" size="sm" className="h-11 w-11 sm:h-8 sm:w-8 p-0" onClick={() => setValidatingItem(item)}>
                            <Eye className="h-4 w-4" />
                         </Button>
                      </TD>
                    </TR>
                  );
                })}
             </TBody>
          </Table>
       </Card>

       <ApproveKrsModal open={Boolean(validatingItem)} onClose={() => setValidatingItem(null)} item={validatingItem} />
    </div>
  );
}
