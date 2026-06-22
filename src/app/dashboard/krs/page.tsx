import { KrsSubmissionItem } from "@/types/domain";
import type { ComponentProps } from "react";
import { connection } from "next/server";

import {
  canSubmitKrs,
  type DosenWaliCandidate,
  getKrsEligibleJadwal,
  getStudentKrs,
  type JadwalRow,
  listDosenWaliCandidates,
  listKrsSubmissions,
} from "@/lib/admin/krs";
import { getDosenIdByUserId } from "@/lib/admin/dosen";
import { createAdminClient } from "@/supabase/admin";
import { requireAuthorizedUser } from "@/lib/auth";
import { KrsManager } from "@/modules/krs/krs-manager";
import { WeeklySchedule } from "@/modules/krs/weekly-schedule";

type WeeklyScheduleItems = ComponentProps<typeof WeeklySchedule>["scheduleItems"];
type WeeklyScheduleItem = WeeklyScheduleItems[number];
type KrsDetailWithSchedule = {
  jadwal: WeeklyScheduleItem | WeeklyScheduleItem[] | null;
};

function pickSchedule(value: KrsDetailWithSchedule["jadwal"]) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function KrsPage() {
  await connection();

  const user = await requireAuthorizedUser("krs", ["Admin", "Prodi", "Dosen", "Mahasiswa"]);
  
  const supabase = createAdminClient();
  if (!supabase) return null;

  // 1. Ambil Tahun Akademik Aktif
  const { data: activeYear } = await supabase
    .from("tahun_akademik")
    .select("*")
    .eq("is_aktif", true)
    .single();

  if (!activeYear) {
    return <div className="p-10 text-center">Tahun akademik aktif belum diset.</div>;
  }

  let mahasiswaId = null;
  let currentKrs = null;
  let krsEligibility = null;
  let submissions: KrsSubmissionItem[] = [];
  let availableJadwal: JadwalRow[] = [];
  let dosenWaliCandidates: DosenWaliCandidate[] = [];

  // 2. Logika per Role
  if (user.role === "Mahasiswa") {
    const { data: mhs } = await supabase
      .from("mahasiswa")
      .select("id, prodi_id")
      .eq("user_id", user.id)
      .single();
    
    if (mhs) {
      mahasiswaId = mhs.id;
      [currentKrs, krsEligibility, availableJadwal] = await Promise.all([
        getStudentKrs(mhs.id, activeYear.id),
        canSubmitKrs(mhs.id, activeYear.id),
        getKrsEligibleJadwal({ mahasiswaId: mhs.id, tahunAkademikId: activeYear.id }),
      ]);
    }
  } else if (user.role === "Dosen") {
    const dosenId = await getDosenIdByUserId(user.id);
    if (dosenId) {
      submissions = await listKrsSubmissions({ 
        tahunAkademikId: activeYear.id,
        dosenId: dosenId 
      });
    }
  } else if (user.role === "Prodi") {
    const { data: prodi } = await supabase
      .from("program_studi")
      .select("id")
      .eq("kaprodi_id", user.id)
      .maybeSingle();

    if (prodi?.id) {
      submissions = await listKrsSubmissions({
        tahunAkademikId: activeYear.id,
        prodiId: prodi.id,
      });
      dosenWaliCandidates = await listDosenWaliCandidates(prodi.id);
    }
  } else {
    submissions = await listKrsSubmissions({ 
      tahunAkademikId: activeYear.id,
    });
    dosenWaliCandidates = await listDosenWaliCandidates();
  }

  // Extract approved schedule items for the student
  let approvedSchedules: WeeklyScheduleItems = [];
  if (user.role === "Mahasiswa" && currentKrs && currentKrs.status === "Disetujui") {
      const details = (currentKrs.krs_detail ?? []) as unknown as KrsDetailWithSchedule[];
      approvedSchedules = details
        .map((detail) => pickSchedule(detail.jadwal))
        .filter((item): item is WeeklyScheduleItem => Boolean(item));
  }

  return (
    <div className="space-y-6">
      {user.role === "Mahasiswa" && approvedSchedules.length > 0 && (
         <WeeklySchedule scheduleItems={approvedSchedules} />
      )}

      <KrsManager 
        availableJadwal={availableJadwal}
        currentKrs={currentKrs}
        tahunAkademik={activeYear}
        user={{ ...user, mahasiswaId }}
        submissions={submissions}
        krsEligibility={krsEligibility}
        dosenWaliCandidates={dosenWaliCandidates}
      />
    </div>
  );
}
