import type { NextRequest } from "next/server";

import { getUserAccessContext } from "@/lib/admin/access-control";
import { exportStudyPrograms } from "@/lib/admin/study-programs";
import { getResolvedSessionUser } from "@/lib/auth";

function csvCell(value: string | boolean) {
  const raw = String(value ?? "");
  return `"${raw.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const user = await getResolvedSessionUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const access = await getUserAccessContext(user.id, user.role);

  if (!access.allowedMenuKeys.includes("master-data.program-studi")) {
    return new Response("Forbidden", { status: 403 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const rows = await exportStudyPrograms(query);

  const body = [
    "kode,nama,jenjang,fakultas_kode,fakultas_nama,is_active",
    ...rows.map((row) =>
      [
        csvCell(row.kode),
        csvCell(row.nama),
        csvCell(row.jenjang),
        csvCell(row.fakultas?.kode ?? ""),
        csvCell(row.fakultas?.nama ?? ""),
        csvCell(row.is_active),
      ].join(","),
    ),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="program-studi.csv"',
    },
  });
}
