"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/supabase/admin";
import { logActivity } from "@/lib/admin/audit-logger";
import { requireAuthorizedUser } from "@/lib/auth";

export async function createMasterBiayaAction(formData: FormData) {
  await requireAuthorizedUser("keuangan.setup", ["Admin", "Keuangan"]);

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase client not available");

  const nama = formData.get("nama")?.toString();
  const nominal = Number(formData.get("nominal"));
  const tahunAkademikId = formData.get("tahunAkademikId")?.toString() || null;
  const prodiId = formData.get("prodiId")?.toString() || null;
  const angkatan = formData.get("angkatan") ? Number(formData.get("angkatan")) : null;
  
  // Advanced fields
  const tingkatKelas = formData.getAll("tingkat_kelas") as string[];
  const jurusan = formData.getAll("jurusan") as string[];
  const jenisKelamin = formData.get("jenis_kelamin")?.toString() || "Semua";
  const gelombang = formData.get("gelombang")?.toString() || null;
  const jalur = formData.get("jalur")?.toString() || null;
  const terbit = formData.get("terbit")?.toString() || "Sekali";
  const bolehAngsur = formData.get("boleh_angsur") === "on";
  const isMutasi = formData.get("is_mutasi") === "on";
  const isBoarding = formData.get("is_boarding") === "on";
  const keterangan = formData.get("keterangan")?.toString() || "";
  const status = formData.get("status") === "on";

  const payload = {
    nama,
    nominal,
    tahun_akademik_id: tahunAkademikId,
    prodi_id: prodiId,
    angkatan,
    tingkat_kelas: tingkatKelas,
    jurusan: jurusan,
    jenis_kelamin: jenisKelamin,
    gelombang,
    jalur,
    terbit,
    boleh_angsur: bolehAngsur,
    is_mutasi: isMutasi,
    is_boarding: isBoarding,
    keterangan,
    status
  };

  const { error } = await supabase.from("master_biaya").insert(payload);

  if (error) throw error;

  // Log Activity
  await logActivity({
    modul: "Keuangan - Master Tarif",
    aksi: "CREATE",
    tableName: "master_biaya",
    newData: payload
  });

  revalidatePath("/dashboard/keuangan");
}

export async function deleteMasterBiayaAction(formData: FormData) {
  await requireAuthorizedUser("keuangan.setup", ["Admin", "Keuangan"]);

  const id = formData.get("id")?.toString();
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase client not available");

  // Fetch old data for audit log
  const { data: oldMaster } = await supabase.from("master_biaya").select("*").eq("id", id).single();

  const { error } = await supabase.from("master_biaya").delete().eq("id", id);
  if (error) throw error;

  // Log Activity
  await logActivity({
    modul: "Keuangan - Master Tarif",
    aksi: "DELETE",
    tableName: "master_biaya",
    recordId: id,
    oldData: oldMaster
  });

  revalidatePath("/dashboard/keuangan");
}

export async function generateBulkTagihanAction(formData: FormData) {
  await requireAuthorizedUser("keuangan.setup", ["Admin", "Keuangan"]);

  const masterId = formData.get("masterId")?.toString();
  const tahunAkademikId = formData.get("tahunAkademikId")?.toString();
  const jatuhTempo = formData.get("jatuhTempo")?.toString();
  
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase client not available");

  const { data: master } = await supabase.from("master_biaya").select("*").eq("id", masterId).single();
  if (!master) throw new Error("Master biaya tidak ditemukan");

  let query = supabase.from("mahasiswa").select("id").eq("status_mahasiswa", "AKTIF");
  if (master.angkatan) query = query.eq("angkatan", master.angkatan);
  if (master.prodi_id) query = query.eq("prodi_id", master.prodi_id);

  const { data: mahasiswa } = await query;
  if (!mahasiswa || mahasiswa.length === 0) throw new Error("Tidak ada mahasiswa yang cocok dengan kriteria");

  // Prevent duplicate tagihan mapping
  const { data: existingTagihan } = await supabase
    .from("tagihan")
    .select("mahasiswa_id")
    .eq("tahun_akademik_id", tahunAkademikId)
    .eq("jenis", master.nama)
    .in("mahasiswa_id", mahasiswa.map(m => m.id));

  const existingMahasiswaIds = new Set(existingTagihan?.map(t => t.mahasiswa_id) || []);

  const tagihanData = mahasiswa
    .filter(m => !existingMahasiswaIds.has(m.id))
    .map(m => ({
      mahasiswa_id: m.id,
      tahun_akademik_id: tahunAkademikId,
      jenis: master.nama,
      nominal: master.nominal,
      jatuh_tempo: jatuhTempo,
      status: "Belum Lunas",
      master_biaya_id: masterId
    }));

  if (tagihanData.length === 0) throw new Error("Semua mahasiswa yang cocok sudah memiliki tagihan ini");

  const { error } = await supabase.from("tagihan").insert(tagihanData);
  if (error) throw error;

  // Log Activity
  await logActivity({
    modul: "Keuangan - Tagihan Massal",
    aksi: "CREATE",
    tableName: "tagihan",
    newData: { 
      master_id: masterId, 
      count: tagihanData.length,
      tahun_akademik_id: tahunAkademikId,
      message: `Berhasil generate ${tagihanData.length} tagihan secara massal.`
    }
  });

  revalidatePath("/dashboard/keuangan");
}
