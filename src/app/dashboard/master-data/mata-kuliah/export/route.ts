import type { NextRequest } from "next/server";

import { getUserAccessContext } from "@/lib/admin/access-control";
import { exportMataKuliah } from "@/lib/admin/mata-kuliah";
import { getResolvedSessionUser } from "@/lib/auth";

function csvCell(value: string | number | boolean) {
  const raw = String(value ?? "");
  return `"${raw.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const user = await getResolvedSessionUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const access = await getUserAccessContext(user.id, user.role);

  if (!access.allowedMenuKeys.includes("master-data.mata-kuliah")) {
    return new Response("Forbidden", { status: 403 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const rows = await exportMataKuliah(query);

  const body = [
    "kode,nama,sks,semester,jenis,prodi_kode,prodi_nama,is_active",
    ...rows.map((row) =>
      [
        csvCell(row.kode),
        csvCell(row.nama),
        csvCell(row.sks),
        csvCell(row.semester),
        csvCell(row.jenis),
        csvCell(row.program_studi?.kode ?? ""),
        csvCell(row.program_studi?.nama ?? ""),
        csvCell(row.is_active),
      ].join(","),
    ),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mata-kuliah.csv"',
    },
  });
}

