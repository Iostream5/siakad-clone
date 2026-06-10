import type { NextRequest } from "next/server";

import { getUserAccessContext } from "@/lib/admin/access-control";
import { exportFaculties } from "@/lib/admin/faculties";
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

  if (!access.allowedMenuKeys.includes("master-data.fakultas")) {
    return new Response("Forbidden", { status: 403 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const rows = await exportFaculties(query);

  const body = [
    "kode,nama,dekan,deskripsi,is_active",
    ...rows.map((row) =>
      [
        csvCell(row.kode),
        csvCell(row.nama),
        csvCell(row.dekan ?? ""),
        csvCell(row.deskripsi ?? ""),
        csvCell(row.is_active),
      ].join(","),
    ),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="fakultas.csv"',
    },
  });
}
