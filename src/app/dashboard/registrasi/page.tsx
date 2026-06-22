import { requireAuthorizedUser } from "@/lib/auth";
import { RegistrasiManager } from "@/modules/master-data/registrasi-manager";
import { listRegistrasi } from "@/lib/admin/registrasi";
import { listAcademicYears } from "@/lib/admin/academic-years";
import { listStudyPrograms } from "@/lib/admin/study-programs";
import { createAdminClient } from "@/supabase/admin";

async function hasActiveSemesterBillForUser(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const [{ data: mahasiswa }, { data: activeYear }] = await Promise.all([
    supabase
      .from("mahasiswa")
      .select("id")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("tahun_akademik")
      .select("id")
      .eq("is_aktif", true)
      .maybeSingle(),
  ]);

  if (!mahasiswa?.id || !activeYear?.id) return false;

  const { data: tagihan } = await supabase
    .from("tagihan")
    .select("id")
    .eq("mahasiswa_id", mahasiswa.id)
    .eq("tahun_akademik_id", activeYear.id)
    .is("deleted_at", null)
    .limit(1);

  return Boolean(tagihan?.length);
}

export default async function RegistrationPage() {
  const user = await requireAuthorizedUser("registrasi", ["Admin", "Staff", "Keuangan", "Mahasiswa"]);

  const [registrasiData, tahunAkademikList, prodiList, studentHasActiveTagihan] = await Promise.all([
    listRegistrasi(user.role === "Mahasiswa" ? { userId: user.id } : {}),
    listAcademicYears(),
    listStudyPrograms(),
    user.role === "Mahasiswa" ? hasActiveSemesterBillForUser(user.id) : Promise.resolve(false),
  ]);

  return (
    <RegistrasiManager
      registrasiData={registrasiData}
      userRole={user.role}
      tahunAkademikList={tahunAkademikList.items.map(t => ({ id: t.id, nama: t.nama, kode: t.kode }))}
      prodiList={prodiList.items.map(p => ({ id: p.id, nama: p.nama, kode: p.kode }))}
      studentHasActiveTagihan={studentHasActiveTagihan}
    />
  );
}
