import { connection } from "next/server";

import { listRuangan } from "@/lib/admin/ruangan";
import { listGedung } from "@/lib/admin/gedung";
import { requireAuthorizedUser } from "@/lib/auth";
import { RuanganManager } from "@/modules/master-data/ruangan-manager";

export default async function RuanganPage(props: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await connection();
  const searchParams = await props.searchParams;
  const query = searchParams.q ?? "";
  const page = Number(searchParams.page ?? "1");

  await requireAuthorizedUser("master-data.ruangan");
  
  const [gedungs, ruanganData] = await Promise.all([
    listGedung(),
    listRuangan({ query, page, pageSize: 10 })
  ]);

  return (
    <div className="space-y-6">
      <RuanganManager 
        gedungs={gedungs} 
        ruanganData={ruanganData} 
      />
    </div>
  );
}
