import { connection } from "next/server";

import { listAcademicYears } from "@/lib/admin/academic-years";
import { listDosen } from "@/lib/admin/dosen";
import { getPmbFeeList, getPmbList, getPmbSelectionData } from "@/lib/admin/pmb";
import { getStudyProgramList } from "@/lib/admin/study-programs";
import { requireAuthorizedUser } from "@/lib/auth";
import { PmbManager, type PmbItem } from "@/modules/pmb/pmb-manager";
import { PmbWizard } from "@/modules/pmb/pmb-wizard";

export default async function PmbPage() {
  await connection();

  const user = await requireAuthorizedUser("pmb", ["Admin", "Prodi", "Staff", "Keuangan"]);
  const [items, pmbFees, selectionData, academicYears, studyPrograms, lecturers] = await Promise.all([
    getPmbList(),
    getPmbFeeList(),
    getPmbSelectionData(),
    listAcademicYears({ pageSize: 100 }),
    getStudyProgramList(),
    listDosen({ pageSize: 200 }),
  ]);

  return (
    <div className="space-y-6">
      <PmbWizard />
      <PmbManager
        items={items as PmbItem[]}
        pmbFees={pmbFees}
        selectionData={selectionData}
        academicYears={academicYears.items}
        studyPrograms={studyPrograms}
        lecturers={lecturers.items}
        userRole={user.role}
      />
    </div>
  );
}
