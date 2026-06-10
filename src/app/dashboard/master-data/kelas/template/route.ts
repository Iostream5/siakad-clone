import type { NextRequest } from "next/server";

import { getUserAccessContext } from "@/lib/admin/access-control";
import { getResolvedSessionUser } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  const user = await getResolvedSessionUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const access = await getUserAccessContext(user.id, user.role);

  if (!access.allowedMenuKeys.includes("master-data.kelas")) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = [
    "kode,nama,prodi_kode,angkatan,tingkat,kapasitas,is_active",
    "KLS-01,Kelas 1A,PAI,2026,Semester 1,40,true",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template-kelas.csv"',
    },
  });
}
