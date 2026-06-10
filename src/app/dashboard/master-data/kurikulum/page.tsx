import { connection } from "next/server";

import { listKurikulum } from "@/lib/admin/kurikulum";
import { getStudyProgramList } from "@/lib/admin/study-programs";
import { requireAuthorizedUser } from "@/lib/auth";
import { KurikulumManager } from "@/modules/master-data/kurikulum-manager";

type KurikulumPageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
    view?: string;
  }>;
};

export default async function KurikulumPage({ searchParams }: KurikulumPageProps) {
  await connection();

  await requireAuthorizedUser("master-data.kurikulum", ["Admin", "Prodi", "Staff"]);
  const params = await searchParams;
  const page = Number(params?.page ?? "1");
  const [kurikulum, prodiList] = await Promise.all([
    listKurikulum({
      query: params?.q,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: 10,
      deletedMode: params?.view === "trash" ? "trash" : params?.view === "all" ? "all" : "active",
    }),
    getStudyProgramList(),
  ]);

  return (
    <div className="space-y-6">
      <KurikulumManager {...kurikulum} prodiList={prodiList} />
    </div>
  );
}
