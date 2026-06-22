"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/supabase/admin";
import { requireAuthorizedUser } from "@/lib/auth";
import { logActivity } from "@/lib/admin/audit-logger";
import { generateRegistrasiForActiveMahasiswa } from "@/lib/admin/registrasi";

const generateSchema = z.object({
  tahunAkademikId: z.string().uuid(),
  prodiId: z.string().uuid().optional().nullable(),
});

type RegistrasiVerificationRow = {
  id: string;
  mahasiswa_id: string;
  tahun_akademik_id: string;
  tagihan_id: string | null;
};

type PaidTagihanCandidate = {
  id: string;
  status: string;
};

async function resolvePaidTagihanForRegistrasi(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  registrasiId: string,
) {
  const { data: registrasi, error: registrasiError } = await supabase
    .from("registrasi_semester")
    .select("id, mahasiswa_id, tahun_akademik_id, tagihan_id")
    .eq("id", registrasiId)
    .maybeSingle();

  if (registrasiError) throw registrasiError;
  const row = registrasi as RegistrasiVerificationRow | null;
  if (!row) throw new Error("Data registrasi tidak ditemukan.");

  if (row.tagihan_id) {
    const { data: linkedTagihan, error: linkedError } = await supabase
      .from("tagihan")
      .select("id, status")
      .eq("id", row.tagihan_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (linkedError) throw linkedError;
    const bill = linkedTagihan as PaidTagihanCandidate | null;
    if (bill?.status === "Lunas") return bill.id;
  }

  const { data: paidTagihan, error: paidError } = await supabase
    .from("tagihan")
    .select("id, status")
    .eq("mahasiswa_id", row.mahasiswa_id)
    .eq("tahun_akademik_id", row.tahun_akademik_id)
    .eq("status", "Lunas")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paidError) throw paidError;
  const paidBill = paidTagihan as PaidTagihanCandidate | null;
  if (!paidBill) {
    throw new Error("Registrasi hanya bisa dilunaskan jika tagihan semester sudah Lunas. Gunakan Dispensasi untuk pengecualian.");
  }

  return paidBill.id;
}

export async function generateRegistrasiAction(values: z.infer<typeof generateSchema>) {
  const user = await requireAuthorizedUser("registrasi", ["Admin", "Keuangan"]);

  const parsed = generateSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid data", details: parsed.error.format() };
  }

  const { tahunAkademikId, prodiId } = parsed.data;

  let result: Awaited<ReturnType<typeof generateRegistrasiForActiveMahasiswa>>;
  try {
    result = await generateRegistrasiForActiveMahasiswa({
      tahunAkademikId,
      prodiId,
      createdBy: user.id,
    });
  } catch (error) {
    console.error("generateRegistrasiAction error:", error);
    return { error: "Gagal generate daftar ulang" };
  }

  await logActivity({
    modul: "registrasi",
    aksi: "CREATE",
    tableName: "registrasi_semester",
    metadata: {
      details: `Generated ${result.created} registrasi semester dari ${result.totalEligible} mahasiswa aktif.`,
      tahunAkademikId,
      prodiId,
      ...result,
    }
  });

  revalidatePath("/dashboard/registrasi");
  return {
    success: true,
    totalEligible: result.totalEligible,
    created: result.created,
    skipped: result.skipped,
  };
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

  let paidTagihanId: string;
  try {
    paidTagihanId = await resolvePaidTagihanForRegistrasi(supabase, registrasiId);
  } catch (error) {
    console.error("verifyRegistrasiAction resolve tagihan error:", error);
    return { error: error instanceof Error ? error.message : "Tagihan belum bisa diverifikasi" };
  }

  const { error } = await supabase
    .from("registrasi_semester")
    .update({
      status: "LUNAS",
      tagihan_id: paidTagihanId,
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
