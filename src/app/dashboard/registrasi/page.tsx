import { requireAuthorizedUser } from "@/lib/auth";
import { RegistrasiManager } from "@/modules/master-data/registrasi-manager";
import { listRegistrasi } from "@/lib/admin/registrasi";
import { listAcademicYears } from "@/lib/admin/academic-years";
import { listStudyPrograms } from "@/lib/admin/study-programs";

export default async function RegistrationPage() {
  const user = await requireAuthorizedUser("registrasi", ["Admin", "Staff", "Keuangan", "Mahasiswa"]);

  const registrasiData = await listRegistrasi();
  const tahunAkademikList = await listAcademicYears();
  const prodiList = await listStudyPrograms();

  return (
    <RegistrasiManager
      registrasiData={registrasiData}
      userRole={user.role}
      tahunAkademikList={tahunAkademikList.items.map(t => ({ id: t.id, nama: t.nama, kode: t.kode }))}
      prodiList={prodiList.items.map(p => ({ id: p.id, nama: p.nama, kode: p.kode }))}
    />
  );
}
