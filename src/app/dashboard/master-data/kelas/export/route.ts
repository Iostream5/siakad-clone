import type { NextRequest } from "next/server";

import { exportKelas } from "@/lib/admin/kelas";
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

  if (!access.allowedMenuKeys.includes("master-data.kelas")) {
    return new Response("Forbidden", { status: 403 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const rows = await exportKelas(query);

  const body = [
    "kode,nama,program_studi_kode,program_studi_nama,angkatan,tingkat,kapasitas,is_active",
    ...rows.map((row) =>
      [
        csvCell(row.kode),
        csvCell(row.nama),
        csvCell(row.program_studi?.kode ?? ""),
        csvCell(row.program_studi?.nama ?? ""),
        csvCell(row.angkatan ?? ""),
        csvCell(row.tingkat ?? ""),
        csvCell(row.kapasitas),
        csvCell(row.is_active),
      ].join(","),
    ),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kelas.csv"',
    },
  });
}
