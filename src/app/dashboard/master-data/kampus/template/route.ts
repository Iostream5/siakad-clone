import type { NextRequest } from "next/server";

import { getUserAccessContext } from "@/lib/admin/access-control";
import { getResolvedSessionUser } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  const user = await getResolvedSessionUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const access = await getUserAccessContext(user.id, user.role);

  if (!access.allowedMenuKeys.includes("master-data.kampus")) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = [
    "kode,nama,alamat,kota,telepon,email,is_active",
    "KMP-01,Kampus Utama,Jl. Contoh No. 1,Bandung,022123456,info@kampus.ac.id,true",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template-kampus.csv"',
    },
  });
}
