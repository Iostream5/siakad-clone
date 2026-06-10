import type { NextRequest } from "next/server";

import { exportKurikulum } from "@/lib/admin/kurikulum";
import { getUserAccessContext } from "@/lib/admin/access-control";
import { getResolvedSessionUser } from "@/lib/auth";

function csvCell(value: string | number | boolean | null | undefined) {
  const raw = String(value ?? "");
  return `"${raw.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const user = await getResolvedSessionUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const access = await getUserAccessContext(user.id, user.role);

  if (!access.allowedMenuKeys.includes("master-data.kurikulum")) {
    return new Response("Forbidden", { status: 403 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const rows = await exportKurikulum(query);

  const body = [
    "kode,nama,program_studi_kode,program_studi_nama,tahun_mulai,total_sks,deskripsi,is_active",
    ...rows.map((row) =>
      [
        csvCell(row.kode),
        csvCell(row.nama),
        csvCell(row.program_studi?.kode ?? ""),
        csvCell(row.program_studi?.nama ?? ""),
        csvCell(row.tahun_mulai),
        csvCell(row.total_sks),
        csvCell(row.deskripsi ?? ""),
        csvCell(row.is_active),
      ].join(","),
    ),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kurikulum.csv"',
    },
  });
}
