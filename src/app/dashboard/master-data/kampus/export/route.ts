import type { NextRequest } from "next/server";

import { exportKampus } from "@/lib/admin/kampus";
import { getUserAccessContext } from "@/lib/admin/access-control";
import { getResolvedSessionUser } from "@/lib/auth";

function csvCell(value: string | boolean | null | undefined) {
  const raw = String(value ?? "");
  return `"${raw.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const user = await getResolvedSessionUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const access = await getUserAccessContext(user.id, user.role);

  if (!access.allowedMenuKeys.includes("master-data.kampus")) {
    return new Response("Forbidden", { status: 403 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const rows = await exportKampus(query);

  const body = [
    "kode,nama,alamat,kota,telepon,email,is_active",
    ...rows.map((row) =>
      [
        csvCell(row.kode),
        csvCell(row.nama),
        csvCell(row.alamat),
        csvCell(row.kota),
        csvCell(row.telepon),
        csvCell(row.email),
        csvCell(row.is_active),
      ].join(","),
    ),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kampus.csv"',
    },
  });
}
