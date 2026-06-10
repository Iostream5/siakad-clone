import { connection } from "next/server";

import { listKampus } from "@/lib/admin/kampus";
import { requireAuthorizedUser } from "@/lib/auth";
import { KampusManager } from "@/modules/master-data/kampus-manager";

type KampusPageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
    view?: string;
  }>;
};

export default async function KampusPage({ searchParams }: KampusPageProps) {
  await connection();

  await requireAuthorizedUser("master-data.kampus", ["Admin", "Prodi", "Staff"]);
  const params = await searchParams;
  const page = Number(params?.page ?? "1");
  const data = await listKampus({
    query: params?.q,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: 10,
    deletedMode: params?.view === "trash" ? "trash" : params?.view === "all" ? "all" : "active",
  });

  return (
    <div className="space-y-6">
      <KampusManager {...data} />
    </div>
  );
}
