import { connection } from "next/server";

import { requireAuthorizedUser } from "@/lib/auth";
import { listMataKuliah } from "@/lib/admin/mata-kuliah";
import { MataKuliahManager } from "@/modules/master-data/mata-kuliah-manager";

type MataKuliahPageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
  }>;
};

export default async function MataKuliahPage({ searchParams }: MataKuliahPageProps) {
  await connection();

  await requireAuthorizedUser("master-data.mata-kuliah");
  const params = await searchParams;
  const page = Number(params?.page ?? "1");
  const data = await listMataKuliah({
    query: params?.q,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: 10,
  });

  return <MataKuliahManager {...data} />;
}
