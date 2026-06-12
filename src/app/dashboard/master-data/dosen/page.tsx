import { connection } from "next/server";

import { listDosen } from "@/lib/admin/dosen";
import { getStudyProgramList } from "@/lib/admin/study-programs";
import { requireAuthorizedUser } from "@/lib/auth";
import { DosenManager } from "@/modules/master-data/dosen-manager";

export default async function DosenPage(props: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await connection();
  const searchParams = await props.searchParams;
  const query = searchParams.q ?? "";
  const page = Number(searchParams.page ?? "1");

  await requireAuthorizedUser("master-data.dosen");
  const prodiList = await getStudyProgramList();
  const { items, totalItems, totalPages, currentPage } = await listDosen({
    query,
    page,
    pageSize: 10,
  });

  return (
    <div className="space-y-6">
      <DosenManager
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
