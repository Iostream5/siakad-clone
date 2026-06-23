"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileCheck2,
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  Plus,
  ReceiptText,
  Settings2,
  Search,
  School,
  UserCheck,
  UserRound,
  UsersRound,
  WalletCards,
  XCircle,
} from "lucide-react";

import {
  deletePmbFeeAction,
  finalizePmbSelectionAction,
  generateNimAction,
  savePmbPassingGradeAction,
  savePmbFeeAction,
  savePmbSelectionComponentAction,
  savePmbSelectionScheduleAction,
  savePmbSelectionScoreAction,
  updatePmbPaymentStatusAction,
  updatePmbStatusAction,
  verifyPmbPaymentAction,
} from "@/actions/pmb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { DosenRow } from "@/lib/admin/dosen";
import type { PmbSelectionData, PmbSelectionScheduleRow, PmbSelectionScoreRow } from "@/lib/admin/pmb";
import type { UserRole } from "@/types/domain";

type PmbDocument = {
  label: string;
  name: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: string;
};

type PmbPaymentItem = {
  id: string;
  tanggal_bayar: string;
  nominal: number | string;
  metode: string;
  bank_pengirim: string | null;
  nama_pengirim: string | null;
  bukti_signed_url?: string | null;
  status: string;
};

export type PmbItem = {
  id: string;
  nomor_pendaftaran: string;
  nama_lengkap: string;
  email: string;
  no_hp: string | null;
  jalur_pendaftaran: string | null;
  jenis_pendaftaran: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  jenis_kelamin: string | null;
  alamat: string | null;
  kota_asal: string | null;
  pendidikan_terakhir: string | null;
  asal_sekolah: string | null;
  jurusan_sekolah: string | null;
  tahun_lulus: number | null;
  nama_ayah: string | null;
  pekerjaan_ayah: string | null;
  nama_ibu: string | null;
  pekerjaan_ibu: string | null;
  no_hp_orang_tua: string | null;
  dokumen: Record<string, PmbDocument> | null;
  status_pendaftaran: string | null;
  status_pembayaran: string | null;
  invoice_number: string | null;
  invoice_amount: number | string | null;
  invoice_due_at: string | null;
  status_seleksi: string;
  skor_seleksi: number | null;
  generated_nim: string | null;
  catatan_panitia: string | null;
  created_at: string;
  pmb_pembayaran?: PmbPaymentItem[];
  program_studi: {
    nama: string;
  } | null;
};

type PmbFeeItem = {
  id: string;
  tahun_akademik_id: string;
  prodi_id: string | null;
  nama: string;
  jalur_pendaftaran: string;
  jenis_pendaftaran: string;
  gelombang: string | null;
  nominal: number | string;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  due_days: number;
  is_active: boolean;
  catatan: string | null;
  created_at: string;
  tahun_akademik?: {
    kode?: string | null;
    nama?: string | null;
  } | null;
  program_studi?: {
    nama?: string | null;
  } | null;
};

type AcademicYearOption = {
  id: string;
  kode: string;
  nama: string;
  is_aktif: boolean;
};

type StudyProgramOption = {
  id: string;
  nama: string;
};

const pmbTabs = [
  { key: "overview", label: "Dashboard", href: "/dashboard/pmb?tab=overview" },
  { key: "tarif", label: "Tarif PMB", href: "/dashboard/pmb?tab=tarif" },
  { key: "pendaftar", label: "Pendaftar", href: "/dashboard/pmb?tab=pendaftar" },
  { key: "pembayaran", label: "Pembayaran", href: "/dashboard/pmb?tab=pembayaran" },
  { key: "seleksi", label: "Seleksi", href: "/dashboard/pmb?tab=seleksi" },
  { key: "registrasi", label: "Registrasi/NIM", href: "/dashboard/pmb?tab=registrasi" },
];

const feePaths = ["Semua", "Reguler", "Prestasi", "Beasiswa", "Transfer"];
const feeTypes = ["Semua", "Baru", "Pindahan", "Lanjutan"];

function formatCurrency(value: number | string | null) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { dateStyle: "medium" });
}

function getDocuments(item: PmbItem) {
  return Object.values(item.dokumen ?? {}).filter((document): document is PmbDocument => Boolean(document?.name));
}

function getLatestPmbPayment(item: PmbItem) {
  return item.pmb_pembayaran?.[0] ?? null;
}

function getPendingPmbPayment(item: PmbItem) {
  return item.pmb_pembayaran?.find((payment) => payment.status === "Menunggu") ?? null;
}

function pendaftaranBadgeClass(status: string | null) {
  if (status === "Registered") return "bg-cyan-100 text-cyan-700";
  if (status === "Accepted") return "bg-emerald-100 text-emerald-700";
  if (status === "Rejected") return "bg-rose-100 text-rose-700";
  if (status === "Verified") return "bg-indigo-100 text-indigo-700";
  if (status === "Waiting Payment") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function paymentBadgeClass(status: string | null) {
  if (status === "paid") return "bg-emerald-100 text-emerald-700";
  if (status === "failed" || status === "expired" || status === "refund") return "bg-rose-100 text-rose-700";
  if (status === "manual_review") return "bg-indigo-100 text-indigo-700";
  return "bg-amber-100 text-amber-700";
}

function seleksiBadgeClass(status: string) {
  if (status === "LULUS") return "bg-emerald-100 text-emerald-700";
  if (status === "DITOLAK") return "bg-rose-100 text-rose-700";
  if (status === "VERIFIKASI") return "bg-indigo-100 text-indigo-700";
  return "bg-blue-100 text-blue-700";
}

function isTabVisible(tabKey: string, role: UserRole) {
  if (tabKey === "tarif") return role === "Admin" || role === "Keuangan";
  if (tabKey === "pembayaran") return role === "Admin" || role === "Staff" || role === "Keuangan";
  return role === "Admin" || role === "Prodi" || role === "Staff";
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof BadgeCheck;
}) {
  return (
    <Card className="rounded-lg border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export function PmbManager({
  items,
  pmbFees,
  selectionData,
  academicYears,
  studyPrograms,
  lecturers,
  userRole,
}: {
  items: PmbItem[];
  pmbFees: PmbFeeItem[];
  selectionData: PmbSelectionData;
  academicYears: AcademicYearOption[];
  studyPrograms: StudyProgramOption[];
  lecturers: DosenRow[];
  userRole: UserRole;
}) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") ?? "overview";
  const visibleTabs = pmbTabs.filter((tab) => isTabVisible(tab.key, userRole));
  const activeTab = visibleTabs.some((tab) => tab.key === requestedTab) ? requestedTab : visibleTabs[0]?.key ?? "overview";
  const [search, setSearch] = useState("");
  const [selectedPmb, setSelectedPmb] = useState<PmbItem | null>(null);

  const filteredItems = useMemo(() => {
    const s = search.toLowerCase();
    const scopedItems = items.filter((item) => {
      if (activeTab === "pembayaran") return item.status_pembayaran !== "paid" && item.status_seleksi !== "DITOLAK";
      if (activeTab === "seleksi") return item.status_seleksi === "VERIFIKASI" || item.status_seleksi === "BARU";
      if (activeTab === "registrasi") return item.status_seleksi === "LULUS" || item.generated_nim;
      return true;
    });

    return scopedItems.filter((item) => {
      return (
        item.nama_lengkap.toLowerCase().includes(s) ||
        item.nomor_pendaftaran.toLowerCase().includes(s) ||
        item.email.toLowerCase().includes(s) ||
        item.invoice_number?.toLowerCase().includes(s)
      );
    });
  }, [activeTab, items, search]);

  const stats = useMemo(
    () => ({
      total: items.length,
      waitingPayment: items.filter((item) => item.status_pendaftaran === "Waiting Payment").length,
      verified: items.filter((item) => item.status_pendaftaran === "Verified").length,
      accepted: items.filter((item) => item.status_pendaftaran === "Accepted").length,
      registered: items.filter((item) => item.status_pendaftaran === "Registered").length,
    }),
    [items],
  );

  const scheduleByPmb = useMemo(() => {
    const map = new Map<string, PmbSelectionScheduleRow>();
    selectionData.schedules.forEach((schedule) => map.set(schedule.pmb_pendaftaran_id, schedule));
    return map;
  }, [selectionData.schedules]);

  const scoresByPmb = useMemo(() => {
    const map = new Map<string, Map<string, PmbSelectionScoreRow>>();
    selectionData.scores.forEach((score) => {
      const current = map.get(score.pmb_pendaftaran_id) ?? new Map<string, PmbSelectionScoreRow>();
      current.set(score.komponen_id, score);
      map.set(score.pmb_pendaftaran_id, current);
    });
    return map;
  }, [selectionData.scores]);

  const exportToExcel = () => {
    const escapeCsv = (str: string | null) => {
      if (!str) return '""';
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvContent = "data:text/csv;charset=utf-8,"
      + "Nomor Pendaftaran,Nama Lengkap,Email,No HP,Jalur,Prodi Pilihan,Status Pendaftaran,Status Seleksi\n"
      + items.map(item => {
        return [
          escapeCsv(item.nomor_pendaftaran),
          escapeCsv(item.nama_lengkap),
          escapeCsv(item.email),
          escapeCsv(item.no_hp || "-"),
          escapeCsv(item.jalur_pendaftaran || "-"),
          escapeCsv(item.program_studi?.nama || "-"),
          escapeCsv(item.status_pendaftaran),
          escapeCsv(item.status_seleksi)
        ].join(",");
      }).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data-pmb.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };


  if (activeTab === "tarif") {
    return (
      <div className="space-y-6">
        <PmbTabs activeTab={activeTab} tabs={visibleTabs} />
        <PmbFeeSetup
          fees={pmbFees}
          academicYears={academicYears}
          studyPrograms={studyPrograms}
        />
      </div>
    );
  }

  if (activeTab === "seleksi") {
    return (
      <div className="space-y-6">
        <PmbTabs activeTab={activeTab} tabs={visibleTabs} />
        <div className="grid gap-3 md:grid-cols-5">
          <MiniStat label="Siap Seleksi" value={filteredItems.length} icon={FileCheck2} />
          <MiniStat label="Terjadwal" value={selectionData.schedules.filter((item) => item.status === "Terjadwal").length} icon={Clock} />
          <MiniStat label="Komponen" value={selectionData.components.filter((item) => item.is_active).length} icon={BadgeCheck} />
          <MiniStat label="Lulus" value={items.filter((item) => item.status_seleksi === "LULUS").length} icon={CheckCircle2} />
          <MiniStat label="Ditolak" value={items.filter((item) => item.status_seleksi === "DITOLAK").length} icon={XCircle} />
        </div>
        <PmbSelectionWorkspace
          items={filteredItems}
          selectionData={selectionData}
          scheduleByPmb={scheduleByPmb}
          scoresByPmb={scoresByPmb}
          academicYears={academicYears}
          studyPrograms={studyPrograms}
          lecturers={lecturers}
          userRole={userRole}
          search={search}
          setSearch={setSearch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PmbTabs activeTab={activeTab} tabs={visibleTabs} />

      <div className="grid gap-3 md:grid-cols-5">
        <MiniStat label="Total" value={stats.total} icon={BadgeCheck} />
        <MiniStat label="Waiting Payment" value={stats.waitingPayment} icon={WalletCards} />
        <MiniStat label="Verified" value={stats.verified} icon={FileCheck2} />
        <MiniStat label="Accepted" value={stats.accepted} icon={CheckCircle2} />
        <MiniStat label="Registered" value={stats.registered} icon={UserCheck} />
      </div>

      <Card className="overflow-hidden rounded-lg border-slate-200 bg-white p-0 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Pendaftaran Mahasiswa Baru</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Pipeline PMB dan invoice pendaftaran</p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari pendaftar, email, atau invoice"
              className="h-10 rounded-lg border-2 border-slate-100 bg-white pl-10 text-xs font-bold"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {(userRole === "Admin" || userRole === "Staff") && (
            <Button variant="outline" size="sm" onClick={exportToExcel} className="h-10 rounded-lg border-2 border-slate-100 bg-white">
              <FileCheck2 className="mr-2 h-4 w-4" /> Export Data
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <THead className="bg-slate-50/50">
              <TR>
                <TH className="pl-6 text-[10px] font-black uppercase">No. Daftar</TH>
                <TH className="text-[10px] font-black uppercase">Calon Mahasiswa</TH>
                <TH className="text-[10px] font-black uppercase">Invoice</TH>
                <TH className="text-[10px] font-black uppercase">Status</TH>
                <TH className="text-[10px] font-black uppercase">Seleksi</TH>
                <TH className="w-[260px] pr-6 text-right text-[10px] font-black uppercase">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {filteredItems.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="py-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Belum ada pendaftar masuk
                  </TD>
                </TR>
              ) : (
                filteredItems.map((item) => (
                  <TR key={item.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50/40">
                    <TD className="pl-6 font-mono text-[10px] font-bold text-slate-500">{item.nomor_pendaftaran}</TD>
                    <TD className="py-4">
                      <p className="text-xs font-black uppercase text-slate-900">{item.nama_lengkap}</p>
                      <p className="mt-1 text-[10px] font-medium text-slate-400">{item.email}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase text-slate-500">{item.program_studi?.nama ?? "-"}</p>
                    </TD>
                    <TD>
                      <p className="font-mono text-[10px] font-black text-slate-700">{item.invoice_number ?? "-"}</p>
                      <p className="mt-1 text-[10px] font-bold text-slate-500">{formatCurrency(item.invoice_amount)}</p>
                      <p className="mt-1 text-[9px] font-bold uppercase text-slate-400">Due {formatDate(item.invoice_due_at)}</p>
                    </TD>
                    <TD>
                      <div className="space-y-1">
                        <Badge className={cn("rounded-md px-2 text-[8px] font-black uppercase tracking-tighter", pendaftaranBadgeClass(item.status_pendaftaran))}>
                          {item.status_pendaftaran ?? "Submitted"}
                        </Badge>
                        <Badge className={cn("rounded-md px-2 text-[8px] font-black uppercase tracking-tighter", paymentBadgeClass(item.status_pembayaran))}>
                          {item.status_pembayaran ?? "pending"}
                        </Badge>
                      </div>
                    </TD>
                    <TD>
                      <Badge className={cn("rounded-md px-2 text-[8px] font-black uppercase tracking-tighter", seleksiBadgeClass(item.status_seleksi))}>
                        {item.status_seleksi}
                      </Badge>
                      {item.generated_nim ? (
                        <div className="mt-1 flex items-center gap-1 text-[9px] font-black uppercase text-cyan-600">
                          <CheckCircle2 className="h-2.5 w-2.5" /> NIM: {item.generated_nim}
                        </div>
                      ) : null}
                      <p className="mt-1 font-mono text-xs font-black text-slate-700">{item.skor_seleksi ?? "-"}</p>
                    </TD>
                    <TD className="pr-6">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg border border-transparent text-cyan-600 transition-all hover:border-cyan-100 hover:bg-cyan-50"
                          title="Lihat Detail"
                          onClick={() => setSelectedPmb(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {item.status_pembayaran !== "paid" && item.status_seleksi !== "DITOLAK" ? (
                          getPendingPmbPayment(item) ? (
                            <div className="flex items-center gap-1">
                              {getPendingPmbPayment(item)?.bukti_signed_url ? (
                                <a href={getPendingPmbPayment(item)?.bukti_signed_url ?? "#"} target="_blank" className="rounded-lg bg-cyan-50 px-3 py-2 text-[9px] font-black uppercase text-cyan-700">
                                  Bukti
                                </a>
                              ) : null}
                              <form action={verifyPmbPaymentAction}>
                                <input type="hidden" name="id" value={getPendingPmbPayment(item)?.id ?? ""} />
                                <input type="hidden" name="status" value="Terverifikasi" />
                                <Button size="sm" className="h-8 rounded-lg bg-emerald-600 px-3 text-[9px] font-black uppercase text-white hover:bg-emerald-700">
                                  Terima
                                </Button>
                              </form>
                              <form action={verifyPmbPaymentAction}>
                                <input type="hidden" name="id" value={getPendingPmbPayment(item)?.id ?? ""} />
                                <input type="hidden" name="status" value="Ditolak" />
                                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-rose-600 hover:bg-rose-50">
                                  Tolak
                                </Button>
                              </form>
                            </div>
                          ) : (
                            <form action={updatePmbPaymentStatusAction}>
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="paymentStatus" value="paid" />
                              <Button size="sm" className="h-8 rounded-lg bg-emerald-600 px-3 text-[9px] font-black uppercase text-white hover:bg-emerald-700">
                                <ReceiptText className="mr-1.5 h-3.5 w-3.5" /> Paid
                              </Button>
                            </form>
                          )
                        ) : null}

                        {item.status_seleksi === "VERIFIKASI" ? (
                          <div className="flex items-center gap-1">
                            <form action={updatePmbStatusAction} className="flex items-center gap-1">
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="status" value="LULUS" />
                              <Input name="skor" type="number" placeholder="SKOR" className="h-8 w-14 rounded-lg border-2 border-slate-100 px-2 text-[10px] font-black" required />
                              <Button size="sm" className="h-8 rounded-lg bg-emerald-600 text-white shadow-lg shadow-emerald-50 hover:bg-emerald-700" title="Luluskan">
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </form>
                            <form action={updatePmbStatusAction}>
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="status" value="DITOLAK" />
                              <Button size="sm" variant="ghost" className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-50" title="Tolak">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </form>
                          </div>
                        ) : null}

                        {item.status_seleksi === "LULUS" && !item.generated_nim ? (
                          <form action={generateNimAction}>
                            <input type="hidden" name="id" value={item.id} />
                            <Button size="sm" className="h-8 rounded-lg bg-cyan-600 px-3 text-[9px] font-black uppercase tracking-tighter text-white shadow-lg shadow-cyan-50 hover:bg-cyan-700">
                              <UserCheck className="mr-1.5 h-3.5 w-3.5" /> NIM
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </div>
      </Card>

      {selectedPmb ? (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md" onClick={() => setSelectedPmb(null)}>
          <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border-none bg-white p-0 shadow-2xl ring-1 ring-white/20" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xl">
                  <Eye className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Detail Calon Mahasiswa</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">No. {selectedPmb.nomor_pendaftaran}</p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setSelectedPmb(null)} className="h-10 w-10 rounded-lg hover:bg-slate-200">
                <XCircle className="h-6 w-6 text-slate-400" />
              </Button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-2">
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <UserRound className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">Biodata</h4>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Lengkap</p>
                  <p className="mt-1 text-lg font-black uppercase tracking-tight text-slate-900">{selectedPmb.nama_lengkap}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <Mail className="mb-2 h-4 w-4 text-indigo-500" />
                    <p className="text-xs font-bold text-slate-700">{selectedPmb.email}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <Phone className="mb-2 h-4 w-4 text-emerald-500" />
                    <p className="text-xs font-bold text-slate-700">{selectedPmb.no_hp || "-"}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Tempat/Tanggal Lahir" value={`${selectedPmb.tempat_lahir ?? "-"} / ${formatDate(selectedPmb.tanggal_lahir)}`} />
                  <Info label="Jenis Kelamin" value={selectedPmb.jenis_kelamin ?? "-"} />
                  <Info label="Kota Asal" value={selectedPmb.kota_asal ?? "-"} />
                  <Info label="Alamat" value={selectedPmb.alamat ?? "-"} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">Pilihan</h4>
                </div>
                <div className="rounded-lg border-2 border-indigo-100 bg-indigo-50/50 p-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600">Program Studi Pilihan</p>
                  <div className="mt-2 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-indigo-700" />
                    <p className="text-sm font-black uppercase leading-tight text-slate-800">{selectedPmb.program_studi?.nama ?? "-"}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Jalur" value={selectedPmb.jalur_pendaftaran ?? "-"} />
                  <Info label="Jenis" value={selectedPmb.jenis_pendaftaran ?? "-"} />
                  <Info label="Pendidikan" value={selectedPmb.pendidikan_terakhir ?? "-"} />
                  <Info label="Tahun Lulus" value={selectedPmb.tahun_lulus?.toString() ?? "-"} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <School className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">Sekolah</h4>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Asal Sekolah" value={selectedPmb.asal_sekolah ?? "-"} />
                  <Info label="Jurusan" value={selectedPmb.jurusan_sekolah ?? "-"} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <UsersRound className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">Orang Tua</h4>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Ayah/Wali" value={selectedPmb.nama_ayah ?? "-"} />
                  <Info label="Pekerjaan Ayah/Wali" value={selectedPmb.pekerjaan_ayah ?? "-"} />
                  <Info label="Ibu/Wali" value={selectedPmb.nama_ibu ?? "-"} />
                  <Info label="Pekerjaan Ibu/Wali" value={selectedPmb.pekerjaan_ibu ?? "-"} />
                  <Info label="No. Orang Tua" value={selectedPmb.no_hp_orang_tua ?? "-"} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ReceiptText className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">Invoice</h4>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Nomor Invoice" value={selectedPmb.invoice_number ?? "-"} />
                  <Info label="Nominal" value={formatCurrency(selectedPmb.invoice_amount)} />
                  <Info label="Jatuh Tempo" value={formatDate(selectedPmb.invoice_due_at)} />
                  <Info label="Pembayaran" value={selectedPmb.status_pembayaran ?? "pending"} />
                </div>
                {getLatestPmbPayment(selectedPmb) ? (
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
                    <p className="text-[8px] font-black uppercase tracking-widest text-indigo-500">Pembayaran Terakhir</p>
                    <p className="mt-1 text-xs font-black text-slate-900">
                      {getLatestPmbPayment(selectedPmb)?.metode} - {formatCurrency(getLatestPmbPayment(selectedPmb)?.nominal ?? 0)}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase text-slate-500">
                      {getLatestPmbPayment(selectedPmb)?.status}
                      {getLatestPmbPayment(selectedPmb)?.bank_pengirim ? ` / ${getLatestPmbPayment(selectedPmb)?.bank_pengirim}` : ""}
                    </p>
                  </div>
                ) : null}
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <FileCheck2 className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">Berkas</h4>
                </div>
                <div className="space-y-2">
                  {getDocuments(selectedPmb).length === 0 ? (
                    <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-xs font-bold text-slate-500">Belum ada dokumen tersimpan.</p>
                  ) : (
                    getDocuments(selectedPmb).map((document) => (
                      <div key={document.path} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{document.label}</p>
                          <p className="mt-1 text-xs font-bold text-slate-700">{document.name}</p>
                        </div>
                        <Badge className="rounded-md bg-emerald-100 px-2 text-[8px] font-black uppercase text-emerald-700">Uploaded</Badge>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-100 p-6">
              <div className="flex items-center gap-2 text-[10px] font-bold italic text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                Mendaftar pada {formatDate(selectedPmb.created_at)}
              </div>
              <Button onClick={() => setSelectedPmb(null)} className="h-10 rounded-lg bg-slate-900 px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-xl hover:bg-black">
                Tutup Detail
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-bold text-slate-800">{value}</p>
    </div>
  );
}

function PmbTabs({
  activeTab,
  tabs,
}: {
  activeTab: string;
  tabs: typeof pmbTabs;
}) {
  return (
    <Card className="rounded-lg border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              "whitespace-nowrap rounded-md px-4 py-2 text-xs font-black uppercase tracking-widest transition",
              activeTab === tab.key
                ? "border border-teal-200 bg-[var(--accent)] text-[var(--primary-strong)] shadow-sm"
                : "border border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </Card>
  );
}

function toDateTimeInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function calculateSelectionScore(
  components: PmbSelectionData["components"],
  scores: Map<string, PmbSelectionScoreRow> | undefined,
) {
  const activeComponents = components.filter((component) => component.is_active && Number(component.bobot) > 0);
  const totalWeight = activeComponents.reduce((sum, component) => sum + Number(component.bobot), 0);
  if (activeComponents.length === 0 || totalWeight <= 0) return null;

  const missing = activeComponents.some((component) => !scores?.has(component.id));
  if (missing) return null;

  const total = activeComponents.reduce((sum, component) => {
    const score = Number(scores?.get(component.id)?.skor ?? 0);
    const normalizedScore = (score / Number(component.skor_maks)) * 100;
    return sum + normalizedScore * (Number(component.bobot) / totalWeight);
  }, 0);

  return total;
}

function PmbKomponenNilaiModal({
  open,
  selectionData,
  onClose,
}: {
  open: boolean;
  selectionData: PmbSelectionData;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border-none bg-white shadow-2xl sm:max-w-2xl">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="text-lg font-black uppercase tracking-tight text-slate-900">Komponen Nilai</DialogTitle>
          <DialogDescription className="text-xs font-semibold text-slate-500">
            Atur komponen penilaian untuk seleksi PMB.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <form action={savePmbSelectionComponentAction} className="grid gap-3">
            <Input name="nama" placeholder="Contoh: Wawancara" className="h-10 rounded-lg font-bold" required />
            <div className="grid gap-3 sm:grid-cols-3">
              <Input name="bobot" type="number" min={1} max={100} defaultValue={50} className="h-10 rounded-lg font-bold" required />
              <Input name="skorMaks" type="number" min={1} defaultValue={100} className="h-10 rounded-lg font-bold" required />
              <Input name="urutan" type="number" min={0} defaultValue={0} className="h-10 rounded-lg font-bold" required />
            </div>
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
              <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 accent-indigo-600" />
              Aktif
            </label>
            <Button type="submit" onClick={onClose} className="h-10 rounded-lg bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-black">
              Simpan Komponen
            </Button>
          </form>

          <div className="space-y-2">
            {selectionData.components.map((component) => (
              <div key={component.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div>
                  <p className="text-xs font-black uppercase text-slate-900">{component.nama}</p>
                  <p className="text-[10px] font-bold text-slate-500">
                    Bobot {component.bobot}% / Maks {component.skor_maks}
                  </p>
                </div>
                <Badge className={cn("rounded-md text-[8px] font-black uppercase", component.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                  {component.is_active ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} className="h-11 rounded-lg px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PmbPassingGradeModal({
  open,
  academicYears,
  studyPrograms,
  selectionData,
  onClose,
}: {
  open: boolean;
  academicYears: AcademicYearOption[];
  studyPrograms: StudyProgramOption[];
  selectionData: PmbSelectionData;
  onClose: () => void;
}) {
  const activeYear = academicYears.find((item) => item.is_aktif) ?? academicYears[0] ?? null;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border-none bg-white shadow-2xl sm:max-w-2xl">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="text-lg font-black uppercase tracking-tight text-slate-900">Passing Grade</DialogTitle>
          <DialogDescription className="text-xs font-semibold text-slate-500">
            Atur batas nilai minimum kelulusan untuk seleksi PMB.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <form action={savePmbPassingGradeAction} className="grid gap-3" onSubmit={onClose}>
            <select name="tahunAkademikId" defaultValue={activeYear?.id ?? ""} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold">
              <option value="">Semua tahun akademik</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>{year.nama}</option>
              ))}
            </select>
            <select name="prodiId" defaultValue="" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold">
              <option value="">Semua prodi</option>
              {studyPrograms.map((program) => (
                <option key={program.id} value={program.id}>{program.nama}</option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-3">
              <select name="jalurPendaftaran" defaultValue="Semua" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold">
                {feePaths.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <select name="jenisPendaftaran" defaultValue="Semua" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold">
                {feeTypes.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <Input name="minimumSkor" type="number" min={0} max={100} defaultValue={60} className="h-10 rounded-lg font-bold" required />
            </div>
            <Input name="gelombang" placeholder="Gelombang opsional" className="h-10 rounded-lg font-bold" />
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
              <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 accent-emerald-600" />
              Aktif
            </label>
            <Button type="submit" onClick={onClose} className="h-10 rounded-lg bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-black">
              Simpan Passing Grade
            </Button>
          </form>

          <div className="space-y-2">
            {selectionData.passingGrades.length === 0 ? (
              <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-xs font-bold text-slate-500">Belum ada passing grade. Default sistem memakai skor 60.</p>
            ) : (
              selectionData.passingGrades.slice(0, 5).map((grade) => (
                <div key={grade.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-black text-slate-900">{grade.program_studi?.nama ?? "Semua prodi"} - Min {grade.minimum_skor}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase text-slate-500">{grade.jalur_pendaftaran} / {grade.jenis_pendaftaran}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} className="h-11 rounded-lg px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PmbSetupSeleksiModal({
  open,
  selectionData,
  academicYears,
  studyPrograms,
  onClose,
}: {
  open: boolean;
  selectionData: PmbSelectionData;
  academicYears: AcademicYearOption[];
  studyPrograms: StudyProgramOption[];
  onClose: () => void;
}) {
  const [subModal, setSubModal] = useState<"komponen" | "passing" | null>(null);

  return (
    <>
      <Dialog open={open && !subModal} onOpenChange={(next) => { if (!next) onClose(); }}>
        <DialogContent className="rounded-lg border-none bg-white shadow-2xl sm:max-w-md">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-slate-900">Setup Seleksi PMB</DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-500">
              Pilih menu setup yang ingin dikelola.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-6">
            <button
              type="button"
              onClick={() => setSubModal("komponen")}
              className="group flex items-center gap-5 rounded-lg border-2 border-indigo-100 bg-indigo-50/50 p-6 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-black uppercase tracking-tight text-slate-900 group-hover:text-indigo-700">Komponen Nilai</h4>
                <p className="mt-1 text-xs font-semibold text-slate-500">Atur komponen penilaian seleksi (wawancara, tes, dll)</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600" />
            </button>

            <button
              type="button"
              onClick={() => setSubModal("passing")}
              className="group flex items-center gap-5 rounded-lg border-2 border-emerald-100 bg-emerald-50/50 p-6 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg">
                <Award className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-black uppercase tracking-tight text-slate-900 group-hover:text-emerald-700">Passing Grade</h4>
                <p className="mt-1 text-xs font-semibold text-slate-500">Atur batas nilai minimum kelulusan per prodi/jalur</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
            </button>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="h-11 rounded-lg px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PmbKomponenNilaiModal
        open={subModal === "komponen"}
        selectionData={selectionData}
        onClose={() => setSubModal(null)}
      />

      <PmbPassingGradeModal
        open={subModal === "passing"}
        academicYears={academicYears}
        studyPrograms={studyPrograms}
        selectionData={selectionData}
        onClose={() => setSubModal(null)}
      />
    </>
  );
}

function PmbSelectionWorkspace({
  items,
  selectionData,
  scheduleByPmb,
  scoresByPmb,
  academicYears,
  studyPrograms,
  lecturers,
  userRole,
  search,
  setSearch,
}: {
  items: PmbItem[];
  selectionData: PmbSelectionData;
  scheduleByPmb: Map<string, PmbSelectionScheduleRow>;
  scoresByPmb: Map<string, Map<string, PmbSelectionScoreRow>>;
  academicYears: AcademicYearOption[];
  studyPrograms: StudyProgramOption[];
  lecturers: DosenRow[];
  userRole: UserRole;
  search: string;
  setSearch: (value: string) => void;
}) {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const canManageSetup = userRole === "Admin" || userRole === "Prodi";

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-lg border-slate-200 bg-white p-0 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Seleksi dan Wawancara</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Jadwal, skor, dan keputusan PMB</p>
          </div>
          <div className="flex items-center gap-3">
            {canManageSetup ? (
              <Button
                onClick={() => setShowSetupModal(true)}
                className="h-10 rounded-lg bg-indigo-600 px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg hover:bg-indigo-700"
              >
                <Settings2 className="mr-2 h-4 w-4" /> Setup Seleksi
              </Button>
            ) : null}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari calon mahasiswa"
                className="h-10 rounded-lg border-2 border-slate-100 bg-white pl-10 text-xs font-bold"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="p-10 text-center text-xs font-bold text-slate-500">
              Belum ada pendaftar yang siap seleksi. Verifikasi pembayaran PMB terlebih dahulu.
            </div>
          ) : (
            items.map((item) => {
              const schedule = scheduleByPmb.get(item.id);
              const scores = scoresByPmb.get(item.id);
              const finalScore = calculateSelectionScore(selectionData.components, scores);
              return (
                <div key={item.id} className="grid gap-5 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] font-bold text-slate-400">{item.nomor_pendaftaran}</p>
                      <h4 className="mt-1 text-sm font-black uppercase text-slate-900">{item.nama_lengkap}</h4>
                      <p className="mt-1 text-[10px] font-bold uppercase text-slate-500">{item.program_studi?.nama ?? "-"} / {item.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("rounded-md px-2 text-[8px] font-black uppercase", seleksiBadgeClass(item.status_seleksi))}>
                        {item.status_seleksi}
                      </Badge>
                      <Badge variant="outline" className="rounded-md px-2 text-[8px] font-black uppercase">
                        Skor {finalScore === null ? item.skor_seleksi ?? "-" : finalScore.toFixed(2)}
                      </Badge>
                    </div>
                  </div>

                  <form action={savePmbSelectionScheduleAction} className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 md:grid-cols-5">
                    <input type="hidden" name="pmbRegistrationId" value={item.id} />
                    <select name="tipe" defaultValue={schedule?.tipe ?? "Wawancara"} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold">
                      <option value="Wawancara">Wawancara</option>
                      <option value="Tes Tulis">Tes Tulis</option>
                      <option value="Administrasi">Administrasi</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                    <Input name="scheduledAt" type="datetime-local" defaultValue={toDateTimeInput(schedule?.scheduled_at)} className="h-10 rounded-lg font-bold" required />
                    <Input name="lokasi" placeholder="Lokasi/link" defaultValue={schedule?.lokasi ?? ""} className="h-10 rounded-lg font-bold" />
                    <select name="interviewerId" defaultValue={schedule?.interviewer_id ?? ""} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold">
                      <option value="">Pewawancara</option>
                      {lecturers.map((lecturer) => (
                        <option key={lecturer.id} value={lecturer.id}>
                          {lecturer.users?.full_name ?? lecturer.nidn ?? lecturer.id}
                        </option>
                      ))}
                    </select>
                    <Button className="h-10 rounded-lg bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-700">
                      Jadwalkan
                    </Button>
                  </form>

                  <div className="grid gap-3 md:grid-cols-2">
                    {selectionData.components.filter((component) => component.is_active).map((component) => {
                      const score = scores?.get(component.id);
                      return (
                        <form key={component.id} action={savePmbSelectionScoreAction} className="grid gap-2 rounded-lg border border-slate-100 bg-white p-4">
                          <input type="hidden" name="pmbRegistrationId" value={item.id} />
                          <input type="hidden" name="componentId" value={component.id} />
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-black uppercase text-slate-900">{component.nama}</p>
                              <p className="text-[10px] font-bold text-slate-500">Bobot {component.bobot}% / Maks {component.skor_maks}</p>
                            </div>
                            <Input name="skor" type="number" min={0} max={Number(component.skor_maks)} defaultValue={score?.skor ?? ""} className="h-9 w-24 rounded-lg text-center font-black" required />
                          </div>
                          <Input name="catatan" placeholder="Catatan opsional" defaultValue={score?.catatan ?? ""} className="h-9 rounded-lg text-xs font-bold" />
                          <Button variant="outline" className="h-9 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            Simpan Nilai
                          </Button>
                        </form>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-600">
                      Finalisasi akan menghitung skor berbobot dan membandingkan dengan passing grade.
                    </p>
                    <form action={finalizePmbSelectionAction}>
                      <input type="hidden" name="pmbRegistrationId" value={item.id} />
                      <Button disabled={item.status_seleksi === "LULUS" || item.status_seleksi === "DITOLAK"} className="h-10 rounded-lg bg-emerald-600 px-5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700 disabled:opacity-50">
                        Finalisasi Hasil
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {canManageSetup ? (
        <PmbSetupSeleksiModal
          open={showSetupModal}
          selectionData={selectionData}
          academicYears={academicYears}
          studyPrograms={studyPrograms}
          onClose={() => setShowSetupModal(false)}
        />
      ) : null}
    </div>
  );
}

function PmbFeeForm({
  editingFee,
  academicYears,
  studyPrograms,
  onClose,
}: {
  editingFee: PmbFeeItem | null;
  academicYears: AcademicYearOption[];
  studyPrograms: StudyProgramOption[];
  onClose: () => void;
}) {
  const defaultAcademicYear = academicYears.find((item) => item.is_aktif) ?? academicYears[0] ?? null;
  const isEditing = editingFee !== null;

  return (
    <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border-none bg-white shadow-2xl sm:max-w-2xl">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="text-lg font-black uppercase tracking-tight text-slate-900">
            {isEditing ? "Edit Tarif PMB" : "Buat Tarif PMB"}
          </DialogTitle>
          <DialogDescription className="text-xs font-semibold text-slate-500">
            {isEditing
              ? `Memperbarui tarif: ${editingFee.nama}`
              : "Tarif bisa dibuat umum untuk semua prodi atau spesifik per prodi."}
          </DialogDescription>
        </DialogHeader>

        <form action={savePmbFeeAction} className="grid gap-5 py-2" key={editingFee?.id ?? "create"}>
          {isEditing ? <input type="hidden" name="id" value={editingFee.id} /> : null}

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Tahun Akademik</label>
            <select
              name="tahunAkademikId"
              defaultValue={editingFee?.tahun_akademik_id ?? defaultAcademicYear?.id ?? ""}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500"
              required
            >
              {academicYears.length === 0 ? <option value="">Belum ada tahun akademik</option> : null}
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.nama} {year.is_aktif ? "(Aktif)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Nama Biaya</label>
              <Input name="nama" defaultValue={editingFee?.nama ?? "Biaya Pendaftaran PMB"} className="h-11 rounded-lg font-bold" required />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Nominal</label>
              <Input name="nominal" type="number" min={0} step={1000} defaultValue={editingFee?.nominal ?? 250000} className="h-11 rounded-lg font-bold" required />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Program Studi</label>
            <select
              name="prodiId"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500"
              defaultValue={editingFee?.prodi_id ?? ""}
            >
              <option value="">Semua prodi</option>
              {studyPrograms.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Jalur</label>
              <select name="jalurPendaftaran" defaultValue={editingFee?.jalur_pendaftaran ?? "Semua"} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500">
                {feePaths.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Jenis</label>
              <select name="jenisPendaftaran" defaultValue={editingFee?.jenis_pendaftaran ?? "Semua"} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500">
                {feeTypes.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Gelombang</label>
              <Input name="gelombang" defaultValue={editingFee?.gelombang ?? ""} placeholder="Opsional" className="h-11 rounded-lg font-bold" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Mulai Berlaku</label>
              <Input name="tanggalMulai" type="date" defaultValue={editingFee?.tanggal_mulai?.split("T")[0] ?? ""} className="h-11 rounded-lg font-bold" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Selesai Berlaku</label>
              <Input name="tanggalSelesai" type="date" defaultValue={editingFee?.tanggal_selesai?.split("T")[0] ?? ""} className="h-11 rounded-lg font-bold" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Jatuh Tempo</label>
              <Input name="dueDays" type="number" min={1} max={60} defaultValue={editingFee?.due_days ?? 3} className="h-11 rounded-lg font-bold" required />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Catatan</label>
            <textarea
              name="catatan"
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500"
              placeholder="Opsional"
              defaultValue={editingFee?.catatan ?? ""}
            />
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700">
            <input name="isActive" type="checkbox" defaultChecked={editingFee?.is_active ?? true} className="h-4 w-4 accent-emerald-600" />
            Aktif untuk invoice baru
          </label>

          <DialogFooter className="border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="h-11 rounded-lg px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Batal
            </Button>
            <Button type="submit" onClick={onClose} className={`h-11 rounded-lg px-6 text-[10px] font-black uppercase tracking-widest text-white ${isEditing ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
              {isEditing ? "Update Tarif" : "Simpan Tarif"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PmbFeeSetup({
  fees,
  academicYears,
  studyPrograms,
}: {
  fees: PmbFeeItem[];
  academicYears: AcademicYearOption[];
  studyPrograms: StudyProgramOption[];
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState<PmbFeeItem | null>(null);

  return (
    <Card className="overflow-hidden rounded-lg border-slate-200 bg-white p-0 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Daftar tarif</p>
          <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-slate-900">Biaya PMB per periode</h3>
        </div>
        <Button
          onClick={() => { setEditingFee(null); setShowModal(true); }}
          className="h-10 rounded-lg bg-emerald-600 px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Buat Tarif PMB
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <THead className="bg-slate-50/50">
            <TR>
              <TH className="pl-6 text-[10px] font-black uppercase">Tahun</TH>
              <TH className="text-[10px] font-black uppercase">Scope</TH>
              <TH className="text-[10px] font-black uppercase">Nominal</TH>
              <TH className="text-[10px] font-black uppercase">Berlaku</TH>
              <TH className="text-right pr-6 text-[10px] font-black uppercase">Aksi</TH>
            </TR>
          </THead>
          <TBody>
            {fees.length === 0 ? (
              <TR>
                <TD colSpan={5} className="py-16 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Belum ada tarif PMB. Klik "Buat Tarif PMB" untuk membuat tarif baru.
                </TD>
              </TR>
            ) : (
              fees.map((fee) => (
                <TR key={fee.id} className="border-b border-slate-50">
                  <TD className="pl-6">
                    <p className="text-xs font-black text-slate-900">{fee.tahun_akademik?.nama ?? "-"}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">{fee.tahun_akademik?.kode ?? "-"}</p>
                  </TD>
                  <TD>
                    <p className="text-xs font-black uppercase text-slate-800">{fee.program_studi?.nama ?? "Semua prodi"}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase text-slate-500">
                      {fee.jalur_pendaftaran} / {fee.jenis_pendaftaran}
                    </p>
                    {fee.gelombang ? <p className="mt-1 text-[10px] font-bold text-slate-400">{fee.gelombang}</p> : null}
                  </TD>
                  <TD>
                    <p className="text-sm font-black text-slate-900">{formatCurrency(fee.nominal)}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">{fee.due_days} hari jatuh tempo</p>
                  </TD>
                  <TD>
                    <div className="space-y-1">
                      <Badge className={cn("rounded-md px-2 text-[8px] font-black uppercase", fee.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                        {fee.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                      <p className="text-[10px] font-bold text-slate-500">
                        {formatDate(fee.tanggal_mulai)} - {formatDate(fee.tanggal_selesai)}
                      </p>
                    </div>
                  </TD>
                  <TD className="pr-6 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg text-blue-500 hover:bg-blue-50"
                        title="Edit Tarif"
                        onClick={() => { setEditingFee(fee); setShowModal(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <form action={deletePmbFeeAction}>
                        <input type="hidden" name="id" value={fee.id} />
                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-50" title="Hapus Tarif">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </div>

      {showModal ? (
        <PmbFeeForm
          editingFee={editingFee}
          academicYears={academicYears}
          studyPrograms={studyPrograms}
          onClose={() => { setShowModal(false); setEditingFee(null); }}
        />
      ) : null}
    </Card>
  );
}
