"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { AlertCircle, Trash2, Zap } from "lucide-react";

import {
  bulkSoftDeleteTagihanAction,
  getStudentLedgerAction,
  sendOverdueTagihanNotificationsAction,
  sendTagihanNotificationAction,
  syncAllStudentsStatusAction,
  verifyPaymentAction,
} from "@/actions/finance";
import { deleteMasterBiayaAction, generateBulkTagihanAction } from "@/actions/finance-master";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import type { StudentLedgerData } from "@/lib/admin/finance";
import type { MahasiswaRow } from "@/lib/admin/mahasiswa";
import type { PmbPortalData } from "./tabs/tab-pmb-payment";

const TabSummary = dynamic(() => import("./tabs/tab-summary"));
const TabTagihan = dynamic(() => import("./tabs/tab-tagihan"));
const TabPembayaran = dynamic(() => import("./tabs/tab-pembayaran"));
const TabStudentSummary = dynamic(() => import("./tabs/tab-student-summary"));
const TabStudentTagihan = dynamic(() => import("./tabs/tab-student-tagihan"));
const TabStudentPembayaran = dynamic(() => import("./tabs/tab-student-pembayaran"));
const TabSetup = dynamic(() => import("./tabs/tab-setup"));
const TabPmbPayment = dynamic(() => import("./tabs/tab-pmb-payment"));
const TabCashflow = dynamic(() => import("./tabs/tab-cashflow"));
const TabLaporan = dynamic(() => import("./tabs/tab-laporan"));

const LedgerModal = dynamic(() => import("./modals/ledger-modal"));
const AddTagihanModal = dynamic(() => import("./modals/add-tagihan-modal"));
const AddMasterBiayaModal = dynamic(() => import("./modals/add-master-biaya-modal"));
const ImportTagihanModal = dynamic(() => import("./modals/import-tagihan-modal"));
const EditTagihanModal = dynamic(() => import("./modals/edit-tagihan-modal"));

type FinanceManagerProps = {
  tagihan: FinanceBillListItem[];
  pembayaran: FinancePaymentListItem[];
  pmbPembayaran: FinancePmbPaymentItem[];
  cashFlow: FinanceCashFlowItem[];
  summary: { balance: number; income: number; expense: number };
  categories: FinanceCategoryItem[];
  mahasiswaList: MahasiswaRow[];
  tahunAkademikList: FinanceAcademicYearOption[];
  masterBiayaList: FinanceMasterBiayaItem[];
  prodiList: FinanceStudyProgramOption[];
  pmbPaymentPortal: PmbPortalData | null;
  laporanKeuangan: FinanceReportItem[];
  setupData: FinanceSetupData;
  userRole: string;
  studentLedger?: StudentLedgerData | null;
};

type FinanceBillListItem = {
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

type FinancePaymentListItem = {
  id: string;
  nominal: number | string;
  status: string;
  metode: string;
  bukti_url?: string | null;
  tagihan?: {
    jenis?: string | null;
    mahasiswa?: {
      id?: string;
      nim?: string | null;
      users?: {
        full_name?: string | null;
      } | null;
    } | null;
  } | null;
};

type FinancePmbPaymentItem = {
  id: string;
  tanggal_bayar: string;
  nominal: number | string;
  metode: string;
  bukti_url?: string | null;
  status: string;
  pmb_pendaftaran?: {
    nomor_pendaftaran?: string | null;
    nama_lengkap?: string | null;
    email?: string | null;
    program_studi?: {
      nama?: string | null;
    } | null;
  } | null;
};

type FinanceCashFlowItem = {
  id: string;
  tanggal: string;
  tipe: string;
  judul: string;
  deskripsi?: string | null;
  nominal: number | string;
  kategori?: {
    nama?: string | null;
    tipe?: string | null;
  } | null;
};

type FinanceCategoryItem = {
  id: string;
  nama: string;
  tipe: string;
};

type FinanceAcademicYearOption = {
  id: string;
  kode?: string | null;
  nama: string;
  semester?: string | null;
  is_aktif?: boolean | null;
};

type FinanceStudyProgramOption = {
  id: string;
  nama: string;
};

type FinanceMasterBiayaItem = {
  id: string;
  nama: string;
  nominal: number | string;
  angkatan?: number | null;
  tingkat_kelas?: string[] | null;
  jurusan?: string[] | null;
  gelombang?: string | null;
  jalur?: string | null;
  status?: boolean | null;
  program_studi?: {
    nama?: string | null;
  } | null;
  tahun_akademik?: {
    nama?: string | null;
  } | null;
};

type FinanceReportItem = {
  id: string;
  jenis: string;
  nominal: number;
  terbayar: number;
  tunggakan: number;
  status: string;
  jatuhTempo: string;
  mahasiswaNama: string;
  mahasiswaNim: string;
  prodi: string;
};

type FinanceSetupData = {
  coa: Record<string, unknown>[];
  bankAccounts: Record<string, unknown>[];
  bankIntegrations: Record<string, unknown>[];
  paymentMethods: Record<string, unknown>[];
  scholarships: Record<string, unknown>[];
  categories: Record<string, unknown>[];
};

export function FinanceManager({
  tagihan,
  pembayaran,
  pmbPembayaran,
  cashFlow,
  summary,
  categories,
  mahasiswaList,
  tahunAkademikList,
  masterBiayaList,
  prodiList,
  pmbPaymentPortal,
  laporanKeuangan,
  setupData,
  userRole,
  studentLedger = null,
}: FinanceManagerProps) {
  const isBendahara = userRole === "Bendahara";
  const isStudent = userRole === "Mahasiswa";
  const isPmbPayer = userRole === "Calon Mahasiswa";
  const isPimpinan = userRole === "Pimpinan";
  const canManageFinance = userRole === "Admin" || userRole === "Keuangan";
  const canMutateFinance = canManageFinance || isBendahara;
  const searchParams = useSearchParams();
  const { success, error } = useToast();
  const [isPending, startTransition] = useTransition();

  const defaultTab = isPmbPayer ? "pmb" : (isBendahara || isStudent) ? "tagihan" : "summary";
  let activeTab = searchParams.get("tab") || defaultTab;
  if (activeTab === "transaksi") activeTab = "pembayaran";
  if (isPmbPayer && activeTab !== "pmb") activeTab = "pmb";

  const allowedTabs = isPmbPayer
    ? new Set(["pmb"])
    : isStudent
      ? new Set(pmbPaymentPortal ? ["summary", "tagihan", "pembayaran", "pmb"] : ["summary", "tagihan", "pembayaran"])
      : canManageFinance
        ? new Set(["summary", "tagihan", "pembayaran", "cashflow", "laporan", "setup"])
        : isBendahara
          ? new Set(["summary", "tagihan", "pembayaran", "cashflow"])
          : isPimpinan
            ? new Set(["summary", "cashflow", "laporan"])
            : new Set(["summary"]);
  if (!allowedTabs.has(activeTab)) activeTab = defaultTab;

  const [search, setSearch] = useState("");
  const [selectedTagihanIds, setSelectedTagihanIds] = useState<string[]>([]);
  const [showAddTagihan, setShowAddTagihan] = useState(false);
  const [showAddMaster, setShowAddMaster] = useState(false);
  const [showImportTagihan, setShowImportTagihan] = useState(false);
  const [showEditTagihan, setShowEditTagihan] = useState(false);
  const [showDeleteTagihanConfirm, setShowDeleteTagihanConfirm] = useState(false);
  const [showBulkTagihan, setShowBulkTagihan] = useState<string | null>(null);
  const [showDeleteMasterConfirm, setShowDeleteMasterConfirm] = useState<string | null>(null);
  const [selectedLedger, setSelectedLedger] = useState<{ student: MahasiswaRow | null; data: StudentLedgerData } | null>(null);

  const selectedBill = selectedTagihanIds.length === 1
    ? tagihan.find((item) => item.id === selectedTagihanIds[0]) ?? null
    : null;

  const handleSyncStatus = () => {
    startTransition(async () => {
      const result = await syncAllStudentsStatusAction();
      if (result.success) {
        success("Sinkronisasi Berhasil", `${result.count} status mahasiswa telah diperbarui.`);
      } else {
        error("Sinkronisasi Gagal", result.error);
      }
    });
  };

  const handleViewLedger = async (mhsId: string) => {
    const student = mahasiswaList.find((m) => m.id === mhsId) ?? null;
    startTransition(async () => {
      const result = await getStudentLedgerAction(mhsId);
      if ("success" in result && result.success) {
        setSelectedLedger({ student, data: result.data });
      } else {
        error("Gagal memuat buku besar", result.error);
      }
    });
  };

  const handleVerify = (id: string, status: string) => {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("status", status);
    verifyPaymentAction(formData);
  };

  const handleNotifySelected = () => {
    const formData = new FormData();
    formData.append("selectedIds", selectedTagihanIds.join(","));
    sendTagihanNotificationAction(formData);
  };

  const handleNotifyOverdue = () => {
    sendOverdueTagihanNotificationsAction();
  };

  const filteredTagihan = tagihan.filter((item) => {
    const keyword = search.toLowerCase();
    return (
      item.mahasiswa?.users?.full_name?.toLowerCase().includes(keyword) ||
      item.mahasiswa?.nim?.toLowerCase().includes(keyword) ||
      item.jenis.toLowerCase().includes(keyword)
    );
  });

  const pendingPayments = pembayaran.filter((p) => p.status === "Menunggu").length + pmbPembayaran.filter((p) => p.status === "Menunggu").length;
  const totalReceivables = tagihan.filter((t) => t.status === "Belum Lunas").reduce((acc, curr) => acc + Number(curr.nominal), 0);

  const studentTabs = [
    { key: "summary", label: "Ringkasan", href: "/dashboard/keuangan?tab=summary" },
    { key: "tagihan", label: "Daftar Tagihan", href: "/dashboard/keuangan?tab=tagihan" },
    { key: "pembayaran", label: "Riwayat Pembayaran", href: "/dashboard/keuangan?tab=pembayaran" },
    ...(pmbPaymentPortal ? [{ key: "pmb", label: "Riwayat PMB", href: "/dashboard/keuangan?tab=pmb" }] : []),
  ];

  return (
    <div className="space-y-6">
      {isStudent ? (
        <div className="flex flex-wrap gap-2 rounded-none border border-slate-100 bg-white p-2 shadow-sm">
          {studentTabs.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={activeTab === item.key
                ? "rounded-none bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-sm"
                : "rounded-none px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-900"}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}

      {activeTab === "summary" && isStudent && (
        <TabStudentSummary ledger={studentLedger} />
      )}

      {activeTab === "summary" && !isStudent && (
        <TabSummary
          summary={summary}
          totalReceivables={totalReceivables}
          pendingPayments={pendingPayments}
          onSyncStatus={handleSyncStatus}
          isPending={isPending}
          canSyncStatus={canManageFinance}
        />
      )}

      {activeTab === "pmb" && <TabPmbPayment portal={pmbPaymentPortal} />}

      {activeTab === "tagihan" && isStudent && (
        <TabStudentTagihan ledger={studentLedger} />
      )}

      {activeTab === "tagihan" && !isStudent && (
        <TabTagihan
          filteredTagihan={filteredTagihan}
          selectedIds={selectedTagihanIds}
          search={search}
          onSearchChange={setSearch}
          onSelectionChange={setSelectedTagihanIds}
          onAddTagihan={() => setShowAddTagihan(true)}
          onImportTagihan={() => setShowImportTagihan(true)}
          onEditSelected={() => setShowEditTagihan(true)}
          onDeleteSelected={() => setShowDeleteTagihanConfirm(true)}
          onNotifySelected={handleNotifySelected}
          onNotifyOverdue={handleNotifyOverdue}
          onViewLedger={handleViewLedger}
          canCreateTagihan={canMutateFinance}
          canMutateTagihan={canMutateFinance}
        />
      )}

      {activeTab === "pembayaran" && isStudent && (
        <TabStudentPembayaran ledger={studentLedger} />
      )}

      {activeTab === "pembayaran" && !isStudent && (
        <TabPembayaran
          pembayaran={pembayaran}
          pmbPembayaran={pmbPembayaran}
          cashFlow={cashFlow}
          mahasiswaList={mahasiswaList}
          onViewLedger={handleViewLedger}
          verifyAction={handleVerify}
          canVerify={canMutateFinance}
        />
      )}

      {activeTab === "cashflow" && (
        <TabCashflow cashFlow={cashFlow} categories={categories} canMutate={canMutateFinance} />
      )}

      {activeTab === "laporan" && (
        <TabLaporan laporanKeuangan={laporanKeuangan} />
      )}

      {activeTab === "setup" && canManageFinance && (
        <TabSetup
          masterBiayaList={masterBiayaList}
          tahunAkademikList={tahunAkademikList}
          prodiList={prodiList}
          setupData={setupData}
          onAddMaster={() => setShowAddMaster(true)}
          onBulkTagihan={setShowBulkTagihan}
          onDeleteMaster={setShowDeleteMasterConfirm}
        />
      )}

      {selectedLedger && (
        <LedgerModal
          student={selectedLedger.student}
          ledgerData={selectedLedger.data}
          onClose={() => setSelectedLedger(null)}
          userRole={userRole}
        />
      )}

      <AddTagihanModal
        open={showAddTagihan}
        onClose={() => setShowAddTagihan(false)}
        mahasiswaList={mahasiswaList}
        tahunAkademikList={tahunAkademikList}
      />

      <EditTagihanModal
        open={showEditTagihan}
        onClose={() => setShowEditTagihan(false)}
        bill={selectedBill}
        mahasiswaList={mahasiswaList}
        tahunAkademikList={tahunAkademikList}
      />

      <ImportTagihanModal open={showImportTagihan} onClose={() => setShowImportTagihan(false)} />

      <AddMasterBiayaModal
        open={showAddMaster}
        onClose={() => setShowAddMaster(false)}
        tahunAkademikList={tahunAkademikList}
        prodiList={prodiList}
      />

      {showDeleteTagihanConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm" onClick={() => setShowDeleteTagihanConfirm(false)}>
          <Card className="w-full max-w-md overflow-hidden rounded-none border-none shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="space-y-6 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center bg-rose-50 text-rose-600"><Trash2 className="h-8 w-8" /></div>
              <div><h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Hapus Tagihan</h3><p className="mt-2 text-xs font-bold uppercase leading-relaxed tracking-wider text-slate-500">{selectedTagihanIds.length} tagihan akan dihapus soft-delete.</p></div>
              <form action={bulkSoftDeleteTagihanAction} className="flex gap-3" onSubmit={() => setShowDeleteTagihanConfirm(false)}>
                <input type="hidden" name="selectedIds" value={selectedTagihanIds.join(",")} />
                <Button type="button" variant="ghost" onClick={() => setShowDeleteTagihanConfirm(false)} className="h-11 flex-1 rounded-none text-[10px] font-black uppercase tracking-widest text-slate-500">Batal</Button>
                <Button type="submit" className="h-11 flex-1 rounded-none bg-rose-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-rose-700">Hapus</Button>
              </form>
            </div>
          </Card>
        </div>
      )}

      {showBulkTagihan && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md" onClick={() => setShowBulkTagihan(null)}>
          <Card className="w-full max-w-md overflow-hidden rounded-none border-none bg-white shadow-2xl ring-1 ring-white/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 border-b border-slate-50 bg-slate-50/30 p-8">
              <div className="flex h-12 w-12 items-center justify-center bg-sky-600 text-white shadow-xl"><Zap className="h-6 w-6" /></div>
              <div><h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Generate Tagihan Massal</h3><p className="text-[10px] font-black uppercase tracking-widest text-sky-600">Proses Penagihan Otomatis</p></div>
            </div>
            <form action={generateBulkTagihanAction} className="space-y-6 p-8" onSubmit={() => setShowBulkTagihan(null)}>
              <input type="hidden" name="masterId" value={showBulkTagihan} />
              <div className="border border-sky-100 bg-sky-50 p-4"><p className="text-[10px] font-bold uppercase leading-relaxed tracking-wide text-sky-700">Sistem akan membuat tagihan untuk seluruh mahasiswa aktif sesuai kriteria tarif ini.</p></div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Tahun Akademik Target *</label>
                  <select name="tahunAkademikId" className="h-12 w-full rounded-none border-2 border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-sky-500 focus:bg-white" required>
                    {tahunAkademikList.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Tanggal Jatuh Tempo *</label>
                  <Input name="jatuhTempo" type="date" required className="h-12 rounded-none border-2 border-slate-100 bg-slate-50 px-4 font-black focus:border-sky-500 focus:bg-white" />
                </div>
              </div>
              <div className="flex gap-3 border-t border-slate-100 pt-6">
                <Button type="button" variant="ghost" onClick={() => setShowBulkTagihan(null)} className="h-11 flex-1 rounded-none text-[10px] font-black uppercase tracking-widest text-slate-400">Batal</Button>
                <Button type="submit" className="h-11 flex-1 rounded-none bg-sky-600 text-[10px] font-black uppercase tracking-widest text-white shadow-lg hover:bg-sky-700">Proses</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showDeleteMasterConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm" onClick={() => setShowDeleteMasterConfirm(null)}>
          <Card className="w-full max-w-md overflow-hidden rounded-none border-none shadow-2xl ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6 p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center border-2 border-rose-100 bg-rose-50 text-rose-600"><AlertCircle className="h-10 w-10" /></div>
              <div><h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Konfirmasi Hapus Tarif</h3><p className="mt-2 px-4 text-xs font-bold uppercase leading-relaxed tracking-wider text-slate-500">Tarif akan disembunyikan dari data aktif.</p></div>
              <div className="border border-slate-100 bg-slate-50 p-4"><p className="mb-1 text-[10px] font-black uppercase text-slate-400">ID Terpilih</p><p className="truncate font-mono text-xs font-bold text-rose-600">{showDeleteMasterConfirm}</p></div>
              <div className="flex gap-3 pt-4">
                <Button variant="ghost" onClick={() => setShowDeleteMasterConfirm(null)} className="h-12 flex-1 rounded-none text-[10px] font-black uppercase tracking-widest text-slate-400">Batal</Button>
                <form action={deleteMasterBiayaAction} className="flex-1" onSubmit={() => setShowDeleteMasterConfirm(null)}>
                  <input type="hidden" name="id" value={showDeleteMasterConfirm} />
                  <Button type="submit" className="h-12 w-full rounded-none bg-rose-600 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-rose-100 hover:bg-rose-700">Hapus</Button>
                </form>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
