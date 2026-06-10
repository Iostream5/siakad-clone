import type { NextRequest } from "next/server";

import { getUserAccessContext } from "@/lib/admin/access-control";
import { getResolvedSessionUser } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  const user = await getResolvedSessionUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const access = await getUserAccessContext(user.id, user.role);

  if (!access.allowedMenuKeys.includes("master-data.kurikulum")) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = [
    "kode,nama,prodi_kode,tahun_mulai,total_sks,deskripsi,is_active",
    "KUR-01,Kurikulum 2026,PAI,2026,144,Kurikulum terbaru,true",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template-kurikulum.csv"',
    },
  });
}
