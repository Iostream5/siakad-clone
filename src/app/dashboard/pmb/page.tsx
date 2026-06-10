import { connection } from "next/server";

import { listAcademicYears } from "@/lib/admin/academic-years";
import { getPmbFeeList, getPmbList } from "@/lib/admin/pmb";
import { getStudyProgramList } from "@/lib/admin/study-programs";
import { requireAuthorizedUser } from "@/lib/auth";
import { PmbManager, type PmbItem } from "@/modules/pmb/pmb-manager";
import { PmbWizard } from "@/modules/pmb/pmb-wizard";

export default async function PmbPage() {
  await connection();

  const user = await requireAuthorizedUser("pmb", ["Admin", "Prodi", "Staff", "Keuangan"]);
  const [items, pmbFees, academicYears, studyPrograms] = await Promise.all([
    getPmbList(),
    getPmbFeeList(),
    listAcademicYears({ pageSize: 100 }),
    getStudyProgramList(),
  ]);

  return (
    <div className="space-y-6">
      <PmbWizard />
      <PmbManager
        items={items as PmbItem[]}
        pmbFees={pmbFees}
        academicYears={academicYears.items}
        studyPrograms={studyPrograms}
        userRole={user.role}
      />
    </div>
  );
}
