import { connection } from "next/server";

import { listMahasiswa } from "@/lib/admin/mahasiswa";
import { getStudyProgramList } from "@/lib/admin/study-programs";
import { requireAuthorizedUser } from "@/lib/auth";
import { MahasiswaManager } from "@/modules/master-data/mahasiswa-manager";
import { RolePanel } from "@/modules/shared/role-panel";

export default async function MahasiswaPage(props: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await connection();
  const searchParams = await props.searchParams;
  const query = searchParams.q ?? "";
  const page = Number(searchParams.page ?? "1");

  const user = await requireAuthorizedUser("master-data.mahasiswa");
  const prodiList = await getStudyProgramList();
  const { items, totalItems, totalPages, currentPage } = await listMahasiswa({
    query,
    page,
    pageSize: 10,
  });

  return (
    <div className="space-y-6">
      <MahasiswaManager
        items={items}
        totalItems={totalItems}
        totalPages={totalPages}
        currentPage={currentPage}
        query={query}
        prodiList={prodiList}
      />
    </div>
  );
}
