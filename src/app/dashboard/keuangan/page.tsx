import {
  getCashFlowList,
  getFinanceCategories,
  getFinanceSummary,
  getPembayaranList,
  getPmbPembayaranList,
  getStudentLedger,
  getTagihanList,
  type StudentLedgerData,
} from "@/lib/admin/finance";
import { getFinanceSetupData } from "@/lib/admin/finance-setup";
import { getMasterBiayaList } from "@/lib/admin/finance-master";
import { getMahasiswaByUserId, listMahasiswa } from "@/lib/admin/mahasiswa";
import { getPmbPaymentPortal } from "@/lib/admin/pmb";
import { getLaporanKeuangan } from "@/lib/admin/reports";
import { listAcademicYears } from "@/lib/admin/academic-years";
import { getStudyProgramList } from "@/lib/admin/study-programs";
import { requireAuthorizedUser } from "@/lib/auth";
import { FinanceManager } from "@/modules/finance/finance-manager";

const emptySetupData = {
  coa: [],
  bankAccounts: [],
  bankIntegrations: [],
  paymentMethods: [],
  scholarships: [],
  categories: [],
};

function buildStudentFinanceData(ledger: StudentLedgerData) {
  const student = ledger.mahasiswa;

  return {
    tagihan: ledger.tagihan.map((item) => ({
      id: item.id,
      mahasiswa_id: student?.id ?? "",
      jenis: item.jenis,
      nominal: item.nominal,
      jatuh_tempo: item.jatuh_tempo,
      status: item.status,
      created_at: item.created_at,
      mahasiswa: {
        nim: student?.nim ?? null,
        users: {
          full_name: student?.name ?? null,
        },
      },
    })),
    pembayaran: ledger.pembayaran.map((item) => ({
      id: item.id,
      nominal: item.nominal,
      status: item.status,
      metode: item.metode,
      bukti_url: item.bukti_url,
      tagihan: {
        jenis: item.tagihan?.jenis ?? null,
        mahasiswa: {
          id: student?.id ?? "",
          nim: student?.nim ?? null,
          users: {
            full_name: student?.name ?? null,
          },
        },
      },
    })),
    summary: {
      balance: ledger.summary.outstanding,
      income: ledger.summary.totalVerifiedPaid,
      expense: ledger.summary.totalPendingPaid,
    },
  };
}

export default async function FinancePage() {
  const user = await requireAuthorizedUser("keuangan", ["Admin", "Keuangan", "Mahasiswa", "Calon Mahasiswa", "Pimpinan", "Bendahara"]);
  const isStudent = user.role === "Mahasiswa";
  const isPmbCandidate = user.role === "Calon Mahasiswa";

  if (isPmbCandidate) {
    const pmbPaymentPortal = await getPmbPaymentPortal(user.id);

    return (
      <div className="space-y-6">
        <FinanceManager
          tagihan={[]}
          pembayaran={[]}
          cashFlow={[]}
          summary={{ balance: 0, income: 0, expense: 0 }}
          categories={[]}
          mahasiswaList={[]}
          tahunAkademikList={[]}
          masterBiayaList={[]}
          prodiList={[]}
          pmbPaymentPortal={pmbPaymentPortal}
          pmbPembayaran={[]}
          laporanKeuangan={[]}
          setupData={emptySetupData}
          userRole={user.role}
          studentLedger={null}
        />
      </div>
    );
  }

  if (isStudent) {
    const [pmbPaymentPortal, mahasiswa] = await Promise.all([
      getPmbPaymentPortal(user.id),
      getMahasiswaByUserId(user.id),
    ]);
    const ledger = mahasiswa ? await getStudentLedger(mahasiswa.id) : null;
    const studentFinance = ledger
      ? buildStudentFinanceData(ledger)
      : { tagihan: [], pembayaran: [], summary: { balance: 0, income: 0, expense: 0 } };

    return (
      <div className="space-y-6">
        <FinanceManager
          tagihan={studentFinance.tagihan}
          pembayaran={studentFinance.pembayaran}
          cashFlow={[]}
          summary={studentFinance.summary}
          categories={[]}
          mahasiswaList={mahasiswa ? [mahasiswa] : []}
          tahunAkademikList={[]}
          masterBiayaList={[]}
          prodiList={[]}
          pmbPaymentPortal={pmbPaymentPortal}
          pmbPembayaran={[]}
          laporanKeuangan={[]}
          setupData={emptySetupData}
          userRole={user.role}
          studentLedger={ledger}
        />
      </div>
    );
  }

  const [
    tagihan,
    pembayaran,
    pmbPembayaran,
    cashFlow,
    summary,
    categories,
    mahasiswaResult,
    academicYears,
    masterBiaya,
    prodi,
    laporanKeuangan,
    setupData,
  ] = await Promise.all([
    getTagihanList(),
    getPembayaranList(),
    getPmbPembayaranList(),
    getCashFlowList(),
    getFinanceSummary(),
    getFinanceCategories(),
    listMahasiswa({ pageSize: 1000 }),
    listAcademicYears({ pageSize: 100 }),
    getMasterBiayaList(),
    getStudyProgramList(),
    getLaporanKeuangan(),
    getFinanceSetupData(),
  ]);

  return (
    <div className="space-y-6">
      <FinanceManager
        tagihan={tagihan}
        pembayaran={pembayaran}
        cashFlow={cashFlow}
        summary={summary}
        categories={categories}
        mahasiswaList={mahasiswaResult.items}
        tahunAkademikList={academicYears?.items || []}
        masterBiayaList={masterBiaya}
        prodiList={prodi}
        pmbPaymentPortal={null}
        pmbPembayaran={pmbPembayaran}
        laporanKeuangan={laporanKeuangan}
        setupData={setupData}
        userRole={user.role}
        studentLedger={null}
      />
    </div>
  );
}
