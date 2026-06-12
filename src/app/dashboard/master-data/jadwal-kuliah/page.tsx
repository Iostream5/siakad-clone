import { connection } from "next/server";
import { requireAuthorizedUser } from "@/lib/auth";
import { JadwalKuliahManager } from "@/modules/master-data/jadwal-kuliah-manager";
import { listJadwalKuliah } from "@/lib/admin/jadwal-kuliah";
import { getActiveAcademicYear, listAcademicYears } from "@/lib/admin/academic-years";
import { listMataKuliah } from "@/lib/admin/mata-kuliah";
import { listDosen } from "@/lib/admin/dosen";

export default async function JadwalKuliahPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  await connection();
  await requireAuthorizedUser("master-data.jadwal-kuliah", ["Admin", "Prodi"]);

  const q = searchParams.q ?? "";
  const page = Number(searchParams.page) || 1;
  const deletedMode = searchParams.view === "trash" ? "trash" : "active";

  const data = await listJadwalKuliah({
    query: q,
    page,
    pageSize: 10,
    deletedMode,
  });

  const tahunAkademikList = await listAcademicYears({ pageSize: 100 });
  const mataKuliahList = await listMataKuliah({ pageSize: 500 });
  const dosenList = await listDosen({ pageSize: 500 });

  return (
    <JadwalKuliahManager
      items={data.items}
      totalItems={data.totalItems}
      totalPages={data.totalPages}
      currentPage={data.currentPage}
      query={data.query}
      tahunAkademikList={tahunAkademikList.items}
      mataKuliahList={mataKuliahList.items}
      dosenList={dosenList.items}
    />
  );
}