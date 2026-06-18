"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createPmbRegistration,
  deletePmbFee,
  generateNimAndCreateStudent,
  requestPmbPaymentGateway,
  savePmbFee,
  submitPmbTransferPayment,
  updatePmbPaymentStatus,
  updatePmbStatus,
  verifyPmbPayment,
  type PmbPaymentStatus,
} from "@/lib/admin/pmb";
import { withToastParams } from "@/lib/toast-query";
import { pmbRegistrationSchema } from "@/lib/validators";
import { logActivity } from "@/lib/admin/audit-logger";
import { createAdminClient } from "@/supabase/admin";
import { requireAuthorizedUser } from "@/lib/auth";

export type PmbRegistrationState = {
  error: string | null;
  success: null | {
    registrationNumber: string;
    fullName: string;
    program: string;
    email: string;
    invoiceNumber: string;
    invoiceAmount: number;
    invoiceDueAt: string;
    loginEmail: string;
    temporaryPassword: string;
  };
};

function optionalFile(value: FormDataEntryValue | null) {
  if (value instanceof File && value.size > 0) return value;
  return null;
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const raw = value?.toString().trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function registerPmbAction(_: PmbRegistrationState, formData: FormData): Promise<PmbRegistrationState> {
  const rawData = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    program: formData.get("program"), // This is programId
    registrationPath: formData.get("registrationPath"),
    registrationType: formData.get("registrationType"),
    birthPlace: formData.get("birthPlace"),
    birthDate: formData.get("birthDate"),
    gender: formData.get("gender"),
    address: formData.get("address"),
    educationLevel: formData.get("educationLevel"),
    schoolName: formData.get("schoolName"),
    schoolMajor: formData.get("schoolMajor"),
    graduationYear: formData.get("graduationYear"),
    city: formData.get("city"),
    fatherName: formData.get("fatherName"),
    fatherJob: formData.get("fatherJob"),
    motherName: formData.get("motherName"),
    motherJob: formData.get("motherJob"),
    parentPhone: formData.get("parentPhone"),
    notes: formData.get("notes") || undefined,
  };

  const parsed = pmbRegistrationSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Form pendaftaran tidak valid",
      success: null,
    };
  }

  try {
    const result = await createPmbRegistration({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      programId: parsed.data.program,
      registrationPath: parsed.data.registrationPath,
      registrationType: parsed.data.registrationType,
      birthPlace: parsed.data.birthPlace,
      birthDate: parsed.data.birthDate,
      gender: parsed.data.gender,
      address: parsed.data.address,
      educationLevel: parsed.data.educationLevel,
      schoolName: parsed.data.schoolName,
      schoolMajor: parsed.data.schoolMajor,
      graduationYear: Number(parsed.data.graduationYear),
      city: parsed.data.city,
      fatherName: parsed.data.fatherName,
      fatherJob: parsed.data.fatherJob,
      motherName: parsed.data.motherName,
      motherJob: parsed.data.motherJob,
      parentPhone: parsed.data.parentPhone,
      notes: parsed.data.notes,
      documents: {
        identity: optionalFile(formData.get("identityFile")),
        diploma: optionalFile(formData.get("diplomaFile")),
        photo: optionalFile(formData.get("photoFile")),
      },
    });

    const auditResult = {
      registrationNumber: result.registrationNumber,
      fullName: result.fullName,
      program: result.program,
      email: result.email,
      invoiceNumber: result.invoiceNumber,
      invoiceAmount: result.invoiceAmount,
      invoiceDueAt: result.invoiceDueAt,
      loginEmail: result.loginEmail,
    };

    // Log Public Registration
    await logActivity({
      modul: "PMB",
      aksi: "CREATE",
      tableName: "pmb_pendaftaran",
      newData: auditResult,
    });

    return {
      error: null,
      success: result,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Gagal mengirim pendaftaran",
      success: null,
    };
  }
}

export async function updatePmbStatusAction(formData: FormData) {
  await requireAuthorizedUser("pmb.seleksi", ["Admin", "Prodi", "Staff"]);

  const id = formData.get("id")?.toString();
  const rawStatus = formData.get("status")?.toString();
  const skor = formData.get("skor") ? Number(formData.get("skor")) : undefined;

  if (!id || !rawStatus) {
    redirect(
      withToastParams("/dashboard/pmb", {
        variant: "error",
        title: "Parameter tidak valid",
      }),
    );
  }

  if (!["BARU", "VERIFIKASI", "LULUS", "DITOLAK"].includes(rawStatus)) {
    redirect(
      withToastParams("/dashboard/pmb", {
        variant: "error",
        title: "Status seleksi tidak valid",
      }),
    );
  }

  const status = rawStatus as "BARU" | "VERIFIKASI" | "LULUS" | "DITOLAK";

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  // Fetch old data for audit log
  const { data: oldPmb } = await supabase.from("pmb_pendaftaran").select("*").eq("id", id).single();

  try {
    await updatePmbStatus(id, status, skor);

    // Log Activity
    await logActivity({
      modul: "PMB",
      aksi: "APPROVE",
      tableName: "pmb_pendaftaran",
      recordId: id,
      oldData: oldPmb,
      newData: { status_seleksi: status, skor_seleksi: skor }
    });
  } catch (error) {
    redirect(
      withToastParams("/dashboard/pmb", {
        variant: "error",
        title: "Gagal memperbarui status",
        message: "Terjadi kesalahan sistem. Permintaan gagal diproses.",
      }),
    );
  }

  revalidatePath("/dashboard/pmb");
  redirect(
    withToastParams("/dashboard/pmb", {
      variant: "success",
      title: "Status diperbarui",
    }),
  );
}

export async function savePmbFeeAction(formData: FormData) {
  await requireAuthorizedUser("pmb.tarif", ["Admin", "Keuangan"]);

  const id = formData.get("id")?.toString() || undefined;
  const nominal = parseOptionalNumber(formData.get("nominal"));
  const dueDays = parseOptionalNumber(formData.get("dueDays"));

  const payload = {
    tahunAkademikId: formData.get("tahunAkademikId")?.toString() ?? "",
    prodiId: formData.get("prodiId")?.toString() || null,
    nama: formData.get("nama")?.toString() ?? "",
    jalurPendaftaran: formData.get("jalurPendaftaran")?.toString() ?? "",
    jenisPendaftaran: formData.get("jenisPendaftaran")?.toString() ?? "",
    gelombang: formData.get("gelombang")?.toString() || null,
    nominal: nominal ?? Number.NaN,
    tanggalMulai: formData.get("tanggalMulai")?.toString() || null,
    tanggalSelesai: formData.get("tanggalSelesai")?.toString() || null,
    dueDays: dueDays ?? Number.NaN,
    isActive: formData.get("isActive") === "on",
    catatan: formData.get("catatan")?.toString() || null,
  };

  try {
    const savedPayload = await savePmbFee(payload, id);

    await logActivity({
      modul: "PMB - Tarif",
      aksi: id ? "UPDATE" : "CREATE",
      tableName: "pmb_biaya",
      recordId: id,
      newData: savedPayload,
    });
  } catch (error) {
    redirect(
      withToastParams("/dashboard/pmb?tab=tarif", {
        variant: "error",
        title: "Gagal menyimpan tarif PMB",
        message: "Terjadi kesalahan sistem. Permintaan gagal diproses.",
      }),
    );
  }

  revalidatePath("/dashboard/pmb");
  redirect(
    withToastParams("/dashboard/pmb?tab=tarif", {
      variant: "success",
      title: "Tarif PMB disimpan",
    }),
  );
}

export async function deletePmbFeeAction(formData: FormData) {
  await requireAuthorizedUser("pmb.tarif", ["Admin", "Keuangan"]);

  const id = formData.get("id")?.toString();

  if (!id) {
    redirect(
      withToastParams("/dashboard/pmb?tab=tarif", {
        variant: "error",
        title: "ID tarif tidak valid",
      }),
    );
  }

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data: oldFee } = await supabase.from("pmb_biaya").select("*").eq("id", id).single();

  try {
    await deletePmbFee(id);

    await logActivity({
      modul: "PMB - Tarif",
      aksi: "DELETE",
      tableName: "pmb_biaya",
      recordId: id,
      oldData: oldFee,
    });
  } catch (error) {
    redirect(
      withToastParams("/dashboard/pmb?tab=tarif", {
        variant: "error",
        title: "Gagal menghapus tarif PMB",
        message: "Terjadi kesalahan sistem. Permintaan gagal diproses.",
      }),
    );
  }

  revalidatePath("/dashboard/pmb");
  redirect(
    withToastParams("/dashboard/pmb?tab=tarif", {
      variant: "success",
      title: "Tarif PMB dihapus",
    }),
  );
}

export async function submitPmbTransferPaymentAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan.pmb", ["Calon Mahasiswa", "Mahasiswa"]);

  const pmbRegistrationId = formData.get("pmbRegistrationId")?.toString() ?? "";
  const nominal = parseOptionalNumber(formData.get("nominal"));
  const bankPengirim = formData.get("bankPengirim")?.toString() ?? "";
  const namaPengirim = formData.get("namaPengirim")?.toString() ?? "";
  const proofFile = optionalFile(formData.get("proofFile"));

  try {
    await submitPmbTransferPayment({
      userId: user.id,
      pmbRegistrationId,
      nominal: nominal ?? Number.NaN,
      bankPengirim,
      namaPengirim,
      proofFile,
    });

    await logActivity({
      modul: "PMB - Pembayaran",
      aksi: "CREATE",
      tableName: "pmb_pembayaran",
      newData: { pmbRegistrationId, nominal, metode: "Transfer Bank" },
    });
  } catch (error) {
    redirect(
      withToastParams("/dashboard/keuangan?tab=pmb", {
        variant: "error",
        title: "Gagal mengirim bukti transfer",
        message: "Terjadi kesalahan sistem. Permintaan gagal diproses.",
      }),
    );
  }

  revalidatePath("/dashboard/keuangan");
  revalidatePath("/dashboard/pmb");
  redirect(
    withToastParams("/dashboard/keuangan?tab=pmb", {
      variant: "success",
      title: "Bukti transfer terkirim",
      message: "Tim PMB akan memverifikasi pembayaran Anda.",
    }),
  );
}

export async function requestPmbPaymentGatewayAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan.pmb", ["Calon Mahasiswa", "Mahasiswa"]);
  const pmbRegistrationId = formData.get("pmbRegistrationId")?.toString() ?? "";
  let checkoutUrl = "";

  try {
    const result = await requestPmbPaymentGateway({
      userId: user.id,
      pmbRegistrationId,
    });
    checkoutUrl = result.checkoutUrl;
  } catch (error) {
    redirect(
      withToastParams("/dashboard/keuangan?tab=pmb", {
        variant: "error",
        title: "Gagal membuat checkout gateway",
        message: "Terjadi kesalahan sistem. Permintaan gagal diproses.",
      }),
    );
  }

  revalidatePath("/dashboard/keuangan");
  redirect(checkoutUrl);
}

export async function verifyPmbPaymentAction(formData: FormData) {
  const user = await requireAuthorizedUser("pmb.pembayaran", ["Admin", "Staff", "Keuangan"]);

  const id = formData.get("id")?.toString() ?? "";
  const rawStatus = formData.get("status")?.toString();

  if (rawStatus !== "Terverifikasi" && rawStatus !== "Ditolak") {
    redirect(
      withToastParams("/dashboard/pmb?tab=pembayaran", {
        variant: "error",
        title: "Status pembayaran tidak valid",
      }),
    );
  }

  try {
    await verifyPmbPayment(id, user.id, rawStatus);

    await logActivity({
      modul: "PMB - Pembayaran",
      aksi: "APPROVE",
      tableName: "pmb_pembayaran",
      recordId: id,
      newData: { status: rawStatus, verified_by: user.id },
    });
  } catch (error) {
    redirect(
      withToastParams("/dashboard/pmb?tab=pembayaran", {
        variant: "error",
        title: "Gagal memverifikasi pembayaran PMB",
        message: "Terjadi kesalahan sistem. Permintaan gagal diproses.",
      }),
    );
  }

  revalidatePath("/dashboard/pmb");
  revalidatePath("/dashboard/keuangan");
  redirect(
    withToastParams("/dashboard/pmb?tab=pembayaran", {
      variant: "success",
      title: "Pembayaran PMB diproses",
    }),
  );
}

export async function updatePmbPaymentStatusAction(formData: FormData) {
  await requireAuthorizedUser("pmb.pembayaran", ["Admin", "Staff", "Keuangan"]);

  const id = formData.get("id")?.toString();
  const rawStatus = formData.get("paymentStatus")?.toString();

  if (!id || !rawStatus) {
    redirect(
      withToastParams("/dashboard/pmb", {
        variant: "error",
        title: "Parameter pembayaran tidak valid",
      }),
    );
  }

  if (!["pending", "paid", "expired", "failed", "refund", "manual_review"].includes(rawStatus)) {
    redirect(
      withToastParams("/dashboard/pmb", {
        variant: "error",
        title: "Status pembayaran tidak valid",
      }),
    );
  }

  const paymentStatus = rawStatus as PmbPaymentStatus;
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data: oldPmb } = await supabase.from("pmb_pendaftaran").select("*").eq("id", id).single();

  try {
    await updatePmbPaymentStatus(id, paymentStatus);

    await logActivity({
      modul: "PMB",
      aksi: "UPDATE",
      tableName: "pmb_pendaftaran",
      recordId: id,
      oldData: oldPmb,
      newData: { status_pembayaran: paymentStatus },
    });
  } catch (error) {
    redirect(
      withToastParams("/dashboard/pmb", {
        variant: "error",
        title: "Gagal memperbarui pembayaran",
        message: "Terjadi kesalahan sistem. Permintaan gagal diproses.",
      }),
    );
  }

  revalidatePath("/dashboard/pmb");
  redirect(
    withToastParams("/dashboard/pmb", {
      variant: "success",
      title: "Status pembayaran diperbarui",
    }),
  );
}

export async function generateNimAction(formData: FormData) {
  await requireAuthorizedUser("pmb.registrasi", ["Admin", "Prodi", "Staff"]);

  const pmbId = formData.get("id")?.toString();

  if (!pmbId) {
    redirect(
      withToastParams("/dashboard/pmb", {
        variant: "error",
        title: "ID pendaftar tidak valid",
      }),
    );
  }

  try {
    const { nim } = await generateNimAndCreateStudent(pmbId);

    // Log Activity
    await logActivity({
      modul: "PMB",
      aksi: "APPROVE",
      tableName: "mahasiswa",
      newData: { nim, message: "Generate NIM and convert to Student" }
    });

    revalidatePath("/dashboard/pmb");
    revalidatePath("/dashboard/master-data/mahasiswa");
    redirect(
      withToastParams("/dashboard/pmb", {
        variant: "success",
        title: "NIM Berhasil Digenerate",
        message: `Mahasiswa baru berhasil dibuat dengan NIM: ${nim}`,
      }),
    );
  } catch (error) {
    redirect(
      withToastParams("/dashboard/pmb", {
        variant: "error",
        title: "Gagal generate NIM",
        message: "Terjadi kesalahan sistem. Permintaan gagal diproses.",
      }),
    );
  }
}
