"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/supabase/admin";
import { requireAuthorizedUser } from "@/lib/auth";
import { logActivity } from "@/lib/admin/audit-logger";

const generateSchema = z.object({
  mahasiswaIds: z.array(z.string().uuid()),
  tahunAkademikId: z.string().uuid(),
});

export async function generateRegistrasiAction(values: z.infer<typeof generateSchema>) {
  const user = await requireAuthorizedUser("registrasi", ["Admin", "Staff", "Keuangan"]);

  const parsed = generateSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid data", details: parsed.error.format() };
  }

  const { mahasiswaIds, tahunAkademikId } = parsed.data;
  if (mahasiswaIds.length === 0) {
    return { error: "Tidak ada mahasiswa yang dipilih" };
  }

  const supabase = await createAdminClient();
  if (!supabase) return { error: "Failed to initialize database client" };

  const payload = mahasiswaIds.map((id) => ({
    mahasiswa_id: id,
    tahun_akademik_id: tahunAkademikId,
    status: "BELUM" as const,
  }));

  const { error } = await supabase
    .from("registrasi_semester")
    .upsert(payload, { onConflict: "mahasiswa_id,tahun_akademik_id", ignoreDuplicates: true });

  if (error) {
    console.error("generateRegistrasiAction error:", error);
    return { error: "Gagal generate daftar ulang" };
  }

  await logActivity({
    modul: "registrasi",
    aksi: "CREATE",
    tableName: "registrasi_semester",
    metadata: {
      details: `Generated registrasi for ${mahasiswaIds.length} mahasiswa in academic year ${tahunAkademikId}`,
    }
  });

  revalidatePath("/dashboard/registrasi");
  return { success: true };
}

const verifySchema = z.object({
  registrasiId: z.string().uuid(),
});

export async function verifyRegistrasiAction(values: z.infer<typeof verifySchema>) {
  const user = await requireAuthorizedUser("registrasi", ["Admin", "Keuangan"]);

  const parsed = verifySchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid data", details: parsed.error.format() };
  }

  const { registrasiId } = parsed.data;

  const supabase = await createAdminClient();
  if (!supabase) return { error: "Failed to initialize database client" };

  const { error } = await supabase
    .from("registrasi_semester")
    .update({
      status: "LUNAS",
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", registrasiId);

  if (error) {
    console.error("verifyRegistrasiAction error:", error);
    return { error: "Gagal memverifikasi daftar ulang" };
  }

  await logActivity({
    modul: "registrasi",
    aksi: "APPROVE",
    tableName: "registrasi_semester",
    recordId: registrasiId,
    metadata: {
      details: "Verifikasi lunas daftar ulang",
    }
  });

  revalidatePath("/dashboard/registrasi");
  return { success: true };
}

const dispensasiSchema = z.object({
  registrasiId: z.string().uuid(),
  catatan: z.string().min(3),
});

export async function grantDispensasiAction(values: z.infer<typeof dispensasiSchema>) {
  const user = await requireAuthorizedUser("registrasi", ["Admin", "Keuangan"]);

  const parsed = dispensasiSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid data", details: parsed.error.format() };
  }

  const { registrasiId, catatan } = parsed.data;

  const supabase = await createAdminClient();
  if (!supabase) return { error: "Failed to initialize database client" };

  const { error } = await supabase
    .from("registrasi_semester")
    .update({
      status: "DISPENSASI",
      catatan,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", registrasiId);

  if (error) {
    console.error("grantDispensasiAction error:", error);
    return { error: "Gagal memberikan dispensasi" };
  }

  await logActivity({
    modul: "registrasi",
    aksi: "APPROVE",
    tableName: "registrasi_semester",
    recordId: registrasiId,
    metadata: {
      details: `Dispensasi daftar ulang diberikan. Catatan: ${catatan}`,
    }
  });

  revalidatePath("/dashboard/registrasi");
  return { success: true };
}
