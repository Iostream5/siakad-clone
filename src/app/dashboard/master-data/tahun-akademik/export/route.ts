import type { NextRequest } from "next/server";

import { exportAcademicYears } from "@/lib/admin/academic-years";
import { getResolvedSessionUser } from "@/lib/auth";
import { getUserAccessContext } from "@/lib/admin/access-control";

function csvCell(value: string | number | boolean) {
  const raw = String(value);
  return `"${raw.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const user = await getResolvedSessionUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const access = await getUserAccessContext(user.id, user.role);

  if (!access.allowedMenuKeys.includes("master-data.tahun-akademik")) {
    return new Response("Forbidden", { status: 403 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const rows = await exportAcademicYears(query);

  const headers = [
    "kode",
    "nama",
    "semester",
    "tanggal_mulai",
    "tanggal_selesai",
    "is_aktif",
    "is_krs_open",
  ];

  const body = [
    headers.join(","),
    ...rows.map((row) =>
      [
        csvCell(row.kode),
        csvCell(row.nama),
        csvCell(row.semester),
        csvCell(row.tanggal_mulai),
        csvCell(row.tanggal_selesai),
        csvCell(row.is_aktif),
        csvCell(row.is_krs_open),
      ].join(","),
    ),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tahun-akademik.csv"',
    },
  });
}
