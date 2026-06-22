import { connection } from "next/server";

import { listGedung } from "@/lib/admin/gedung";
import { requireAuthorizedUser } from "@/lib/auth";
import { GedungManager } from "@/modules/master-data/gedung-manager";

type GedungPageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
    view?: string;
  }>;
};

export default async function GedungPage({ searchParams }: GedungPageProps) {
  await connection();

  await requireAuthorizedUser("master-data.gedung", ["Admin", "Prodi", "Staff"]);
  const params = await searchParams;
  const page = Number(params?.page ?? "1");
  const data = await listGedung({
    query: params?.q,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: 10,
    deletedMode: params?.view === "trash" ? "trash" : params?.view === "all" ? "all" : "active",
  });

  return (
    <div className="space-y-6">
      <GedungManager {...data} />
    </div>
  );
}
