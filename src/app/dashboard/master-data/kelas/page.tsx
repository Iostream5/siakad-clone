import { connection } from "next/server";

import { listKelas } from "@/lib/admin/kelas";
import { getStudyProgramList } from "@/lib/admin/study-programs";
import { requireAuthorizedUser } from "@/lib/auth";
import { KelasManager } from "@/modules/master-data/kelas-manager";

type KelasPageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
    view?: string;
  }>;
};

export default async function KelasPage({ searchParams }: KelasPageProps) {
  await connection();

  await requireAuthorizedUser("master-data.kelas", ["Admin", "Prodi", "Staff"]);
  const params = await searchParams;
  const page = Number(params?.page ?? "1");
  const [kelas, prodiList] = await Promise.all([
    listKelas({
      query: params?.q,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: 10,
      deletedMode: params?.view === "trash" ? "trash" : params?.view === "all" ? "all" : "active",
    }),
    getStudyProgramList(),
  ]);

  return (
    <div className="space-y-6">
      <KelasManager {...kelas} prodiList={prodiList} />
    </div>
  );
}
