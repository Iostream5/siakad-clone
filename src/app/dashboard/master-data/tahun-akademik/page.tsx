import { connection } from "next/server";

import { listAcademicYears } from "@/lib/admin/academic-years";
import { requireAuthorizedUser } from "@/lib/auth";
import { AcademicYearsManager } from "@/modules/master-data/academic-years-manager";

type TahunAkademikPageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
  }>;
};

export default async function TahunAkademikPage({ searchParams }: TahunAkademikPageProps) {
  await connection();

  await requireAuthorizedUser("master-data.tahun-akademik");
  const params = await searchParams;
  const page = Number(params?.page ?? "1");
  const data = await listAcademicYears({
    query: params?.q,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: 10,
  });

  return (
    <div className="space-y-6">
      <AcademicYearsManager {...data} />
    </div>
  );
}
