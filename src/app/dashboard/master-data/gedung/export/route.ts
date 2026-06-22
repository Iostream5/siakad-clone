import type { NextRequest } from "next/server";

import { exportGedung } from "@/lib/admin/gedung";
import { getUserAccessContext } from "@/lib/admin/access-control";
import { getResolvedSessionUser } from "@/lib/auth";

function csvCell(value: string | boolean | number | null | undefined) {
  const raw = String(value ?? "");
  return `"${raw.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const user = await getResolvedSessionUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const access = await getUserAccessContext(user.id, user.role);

  if (!access.allowedMenuKeys.includes("master-data.gedung")) {
    return new Response("Forbidden", { status: 403 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const rows = await exportGedung(query);

  const body = [
    "kode,nama,jumlah_lantai,keterangan,is_active",
    ...rows.map((row) =>
      [
        csvCell(row.kode),
        csvCell(row.nama),
        csvCell(row.jumlah_lantai),
        csvCell(row.keterangan),
        csvCell(row.is_active),
      ].join(","),
    ),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gedung.csv"',
    },
  });
}
