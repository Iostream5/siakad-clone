import { connection } from "next/server";

import { listFaculties } from "@/lib/admin/faculties";
import { requireAuthorizedUser } from "@/lib/auth";
import { FacultiesManager } from "@/modules/master-data/faculties-manager";

type FakultasPageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
  }>;
};

export default async function FakultasPage({ searchParams }: FakultasPageProps) {
  await connection();

  await requireAuthorizedUser("master-data.fakultas");
  const params = await searchParams;
  const page = Number(params?.page ?? "1");
  const data = await listFaculties({
    query: params?.q,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: 10,
  });

  return <FacultiesManager {...data} />;
}
