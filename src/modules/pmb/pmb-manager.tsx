"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  GraduationCap,
  Mail,
  Phone,
  ReceiptText,
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
  generateNimAction,
  savePmbFeeAction,
  updatePmbPaymentStatusAction,
  updatePmbStatusAction,
  verifyPmbPaymentAction,
} from "@/actions/pmb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn } from "@/lib/utils";
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
  academicYears,
  studyPrograms,
  userRole,
}: {
  items: PmbItem[];
  pmbFees: PmbFeeItem[];
  academicYears: AcademicYearOption[];
  studyPrograms: StudyProgramOption[];
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

function PmbFeeSetup({
  fees,
  academicYears,
  studyPrograms,
}: {
  fees: PmbFeeItem[];
  academicYears: AcademicYearOption[];
  studyPrograms: StudyProgramOption[];
}) {
  const defaultAcademicYear = academicYears.find((item) => item.is_aktif) ?? academicYears[0] ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="rounded-lg border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Master tarif tahunan</p>
          <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-slate-900">Tambah Tarif PMB</h3>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Tarif bisa dibuat umum untuk semua prodi atau spesifik per prodi. Jalur/jenis Semua menjadi fallback.
          </p>
        </div>

        <form action={savePmbFeeAction} className="mt-5 grid gap-4">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Tahun Akademik</label>
            <select
              name="tahunAkademikId"
              defaultValue={defaultAcademicYear?.id ?? ""}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-[var(--primary)]"
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
              <Input name="nama" defaultValue="Biaya Pendaftaran PMB" className="h-11 rounded-lg font-bold" required />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Nominal</label>
              <Input name="nominal" type="number" min={0} step={1000} defaultValue={250000} className="h-11 rounded-lg font-bold" required />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Program Studi</label>
            <select
              name="prodiId"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-[var(--primary)]"
              defaultValue=""
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
              <select name="jalurPendaftaran" defaultValue="Semua" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-[var(--primary)]">
                {feePaths.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Jenis</label>
              <select name="jenisPendaftaran" defaultValue="Semua" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-[var(--primary)]">
                {feeTypes.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Gelombang</label>
              <Input name="gelombang" placeholder="Opsional" className="h-11 rounded-lg font-bold" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Mulai Berlaku</label>
              <Input name="tanggalMulai" type="date" className="h-11 rounded-lg font-bold" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Selesai Berlaku</label>
              <Input name="tanggalSelesai" type="date" className="h-11 rounded-lg font-bold" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Jatuh Tempo</label>
              <Input name="dueDays" type="number" min={1} max={60} defaultValue={3} className="h-11 rounded-lg font-bold" required />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Catatan</label>
            <textarea
              name="catatan"
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[var(--primary)]"
              placeholder="Opsional"
            />
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700">
            <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 accent-emerald-600" />
            Aktif untuk invoice baru
          </label>

          <Button className="h-11 rounded-lg bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-black">
            Simpan Tarif PMB
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden rounded-lg border-slate-200 bg-white p-0 shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Daftar tarif</p>
          <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-slate-900">Biaya PMB per periode</h3>
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
                    Belum ada tarif PMB
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
                      <form action={deletePmbFeeAction}>
                        <input type="hidden" name="id" value={fee.id} />
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-rose-600 hover:bg-rose-50">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </form>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
