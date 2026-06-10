"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Zap, AlertCircle } from "lucide-react";

import { verifyPaymentAction, syncAllStudentsStatusAction, getStudentLedgerAction } from "@/actions/finance";
import { deleteMasterBiayaAction, generateBulkTagihanAction } from "@/actions/finance-master";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import type { StudentLedgerData } from "@/lib/admin/finance";
import type { MahasiswaRow } from "@/lib/admin/mahasiswa";
import type { PmbPortalData } from "./tabs/tab-pmb-payment";

// Lazy Loaded Tabs
const TabSummary = dynamic(() => import("./tabs/tab-summary"));
const TabTagihan = dynamic(() => import("./tabs/tab-tagihan"));
const TabPembayaran = dynamic(() => import("./tabs/tab-pembayaran"));
const TabSetup = dynamic(() => import("./tabs/tab-setup"));
const TabPmbPayment = dynamic(() => import("./tabs/tab-pmb-payment"));

// Lazy Loaded Modals
const LedgerModal = dynamic(() => import("./modals/ledger-modal"));

type FinanceManagerProps = {
  tagihan: FinanceBillListItem[];
  pembayaran: FinancePaymentListItem[];
  cashFlow: unknown[];
  summary: { balance: number; income: number; expense: number };
  categories: unknown[];
  mahasiswaList: MahasiswaRow[];
  tahunAkademikList: FinanceAcademicYearOption[];
  masterBiayaList: unknown[];
  prodiList: unknown[];
  pmbPaymentPortal: PmbPortalData | null;
  userRole: string;
};

type FinanceBillListItem = {
  id: string;
  mahasiswa_id: string;
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

type FinanceAcademicYearOption = {
  id: string;
  nama: string;
};

export function FinanceManager({ 
  tagihan, 
  pembayaran, 
  summary,
  mahasiswaList, 
  tahunAkademikList,
  masterBiayaList,
  prodiList,
  pmbPaymentPortal,
  userRole
}: FinanceManagerProps) {
  const isBendahara = userRole === "Bendahara";
  const isPmbPayer = userRole === "Calon Mahasiswa";
  const searchParams = useSearchParams();
  const { success, error } = useToast();
  const [isPending, startTransition] = useTransition();

  let activeTab = searchParams.get("tab") || (isPmbPayer ? "pmb" : isBendahara ? "tagihan" : "summary");
  if (activeTab === "transaksi") activeTab = "pembayaran";
  if (isPmbPayer && activeTab !== "pmb") activeTab = "pmb";

  const [search, setSearch] = useState("");

  // MODAL & UI STATES
  const [, setShowAddTagihan] = useState(false);
  const [, setShowAddMaster] = useState(false);
  const [showBulkTagihan, setShowBulkTagihan] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedLedger, setSelectedLedger] = useState<{ student: MahasiswaRow | null; data: StudentLedgerData } | null>(null);

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

  const filteredTagihan = tagihan.filter((t) =>
    t.mahasiswa?.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.mahasiswa?.nim?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingPayments = pembayaran.filter((p) => p.status === "Menunggu").length;
  const totalReceivables = tagihan.filter((t) => t.status === "Belum Lunas").reduce((acc, curr) => acc + Number(curr.nominal), 0);

  return (
    <div className="space-y-6">
      {/* Tab Conditional Rendering - Performance Optimized */}
      {activeTab === "summary" && (
        <TabSummary
          summary={summary}
          totalReceivables={totalReceivables}
          pendingPayments={pendingPayments}
          onSyncStatus={handleSyncStatus}
          isPending={isPending}
        />
      )}

      {activeTab === "pmb" && (
        <TabPmbPayment portal={pmbPaymentPortal} />
      )}

      {activeTab === "tagihan" && (
        <TabTagihan
          filteredTagihan={filteredTagihan}
          search={search}
          onSearchChange={setSearch}
          onAddTagihan={() => setShowAddTagihan(true)}
          onViewLedger={handleViewLedger}
          onDelete={setShowDeleteConfirm}
        />
      )}

      {activeTab === "pembayaran" && (
        <TabPembayaran
          pembayaran={pembayaran}
          mahasiswaList={mahasiswaList}
          onViewLedger={handleViewLedger}
          onVerify={() => {}}
          verifyAction={handleVerify}
        />
      )}

      {activeTab === "setup" && (
        <TabSetup
          masterBiayaList={masterBiayaList}
          prodiList={prodiList}
          tahunAkademikList={tahunAkademikList}
          onAddMaster={() => setShowAddMaster(true)}
          onBulkTagihan={setShowBulkTagihan}
          onDeleteMaster={setShowDeleteConfirm}
        />
      )}

      {/* Modals - Rendered only when active */}
      {selectedLedger && (
        <LedgerModal
          student={selectedLedger.student}
          ledgerData={selectedLedger.data}
          onClose={() => setSelectedLedger(null)}
          userRole={userRole}
        />
      )}

      {/* Bulk Tagihan Modal */}
      {showBulkTagihan && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setShowBulkTagihan(null)}>
           <Card className="w-full max-w-md shadow-2xl rounded-none border-none ring-1 ring-white/20 overflow-hidden bg-white" onClick={(e) => e.stopPropagation()}>
              <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                 <div className="h-12 w-12 bg-sky-600 rounded-none flex items-center justify-center text-white shadow-xl"><Zap className="h-6 w-6" /></div>
                 <div><h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Generate Tagihan Massal</h3><p className="text-[10px] text-sky-600 font-black uppercase tracking-widest">Proses Penagihan Otomatis</p></div>
              </div>
              <form action={generateBulkTagihanAction} className="p-8 space-y-6" onSubmit={() => setShowBulkTagihan(null)}>
                 <input type="hidden" name="masterId" value={showBulkTagihan} />
                 <div className="p-4 bg-sky-50 border border-sky-100 rounded-none">
                    <p className="text-[10px] text-sky-700 font-bold leading-relaxed uppercase tracking-wide">
                       Sistem akan membuat tagihan untuk seluruh mahasiswa yang aktif dan sesuai dengan kriteria tarif ini.
                    </p>
                 </div>
                 <div className="space-y-4">
                    <div>
                       <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Tahun Akademik Target *</label>
                       <select name="tahunAkademikId" className="w-full h-12 rounded-none border-2 border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-sky-500 focus:bg-white transition-all" required>
                          {tahunAkademikList.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Tanggal Jatuh Tempo *</label>
                       <Input name="jatuhTempo" type="date" required className="h-12 rounded-none border-2 border-slate-100 bg-slate-50 px-4 font-black focus:border-sky-500 focus:bg-white" />
                    </div>
                 </div>
                 <div className="pt-6 border-t border-slate-100 flex gap-3">
                    <Button type="button" variant="ghost" onClick={() => setShowBulkTagihan(null)} className="flex-1 rounded-none h-11 font-black text-slate-400 uppercase text-[10px] tracking-widest">Batal</Button>
                    <Button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-none h-11 font-black shadow-lg text-[10px] uppercase tracking-widest">Proses Sekarang</Button>
                 </div>
              </form>
           </Card>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setShowDeleteConfirm(null)}>
           <Card className="w-full max-w-md shadow-2xl rounded-none border-none ring-1 ring-white/10 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-8 text-center space-y-6">
                 <div className="mx-auto h-20 w-20 bg-rose-50 rounded-none flex items-center justify-center border-2 border-rose-100 animate-bounce shadow-inner"><AlertCircle className="h-10 w-10 text-rose-600" /></div>
                 <div className="space-y-2"><h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Konfirmasi Penghapusan</h3><p className="text-xs text-slate-500 font-bold uppercase leading-relaxed tracking-wider px-4">Tindakan ini permanen. Parameter tarif akan dihapus dari sistem.</p></div>
                 <div className="p-4 bg-slate-50 border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">ID TERPILIH</p><p className="text-xs font-mono font-bold text-rose-600 truncate">{showDeleteConfirm}</p></div>
                 <div className="flex gap-3 pt-4"><Button variant="ghost" onClick={() => setShowDeleteConfirm(null)} className="flex-1 rounded-none h-12 font-black text-slate-400 uppercase tracking-widest text-[10px]">Batalkan</Button><form action={deleteMasterBiayaAction} className="flex-1" onSubmit={() => setShowDeleteConfirm(null)}><input type="hidden" name="id" value={showDeleteConfirm} /><Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-none h-12 font-black shadow-xl shadow-rose-100 text-[10px] uppercase tracking-widest">Hapus Permanen</Button></form></div>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}
