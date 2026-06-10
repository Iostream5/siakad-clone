import { getTagihanList, getPembayaranList, getCashFlowList, getFinanceSummary, getFinanceCategories } from "@/lib/admin/finance";
import { getMasterBiayaList } from "@/lib/admin/finance-master";
import { listMahasiswa } from "@/lib/admin/mahasiswa";
import { listAcademicYears } from "@/lib/admin/academic-years";
import { getStudyProgramList } from "@/lib/admin/study-programs";
import { getPmbPaymentPortal } from "@/lib/admin/pmb";
import { requireAuthorizedUser } from "@/lib/auth";
import { FinanceManager } from "@/modules/finance/finance-manager";

export default async function FinancePage() {
  const user = await requireAuthorizedUser("keuangan", ["Admin", "Keuangan", "Mahasiswa", "Calon Mahasiswa", "Pimpinan", "Bendahara"]);
  const isStudentLike = user.role === "Mahasiswa" || user.role === "Calon Mahasiswa";

  if (isStudentLike) {
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
          userRole={user.role}
        />
      </div>
    );
  }
  
  const [tagihan, pembayaran, cashFlow, summary, categories, mahasiswaResult, academicYears, masterBiaya, prodi] = await Promise.all([
    getTagihanList(),
    getPembayaranList(),
    getCashFlowList(),
    getFinanceSummary(),
    getFinanceCategories(),
    listMahasiswa({ pageSize: 1000 }),
    listAcademicYears({ pageSize: 100 }),
    getMasterBiayaList(),
    getStudyProgramList()
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
        userRole={user.role}
      />
    </div>
  );
}
