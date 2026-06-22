"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  saveFinanceSetupRecord,
  setActiveAcademicYear,
  softDeleteFinanceSetupRecord,
  type FinanceSetupKind,
} from "@/lib/admin/finance-setup";
import { logActivity } from "@/lib/admin/audit-logger";
import { requireAuthorizedUser } from "@/lib/auth";
import { withToastParams } from "@/lib/toast-query";

const setupPath = "/dashboard/keuangan?tab=setup";

const setupKinds = ["coa", "bank-account", "bank-integration", "payment-method", "scholarship", "category"] as const;

const nullableId = z.string().trim().uuid().or(z.literal("")).transform((value) => value || null);
const requiredId = z.string().trim().uuid();
const activeBoolean = z.preprocess((value) => value === "on" || value === "true", z.boolean());

function getString(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? "";
}

function getOptionalInt(formData: FormData, key: string) {
  const raw = getString(formData, key);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : null;
}

function setupRedirect(kind: string, variant: "success" | "error", title: string, message?: string): never {
  redirect(withToastParams(`${setupPath}&setup=${kind}`, { variant, title, message }));
}

function parseSetupPayload(kind: FinanceSetupKind, formData: FormData) {
  if (kind === "coa") {
    return z.object({
      kode: z.string().trim().min(1).max(24),
      nama: z.string().trim().min(2).max(120),
      tipe: z.enum(["Aset", "Kewajiban", "Ekuitas", "Pendapatan", "Beban"]),
      parent_id: nullableId,
      deskripsi: z.string().trim().max(500).nullable(),
      is_active: activeBoolean,
    }).parse({
      kode: getString(formData, "kode"),
      nama: getString(formData, "nama"),
      tipe: getString(formData, "tipe"),
      parent_id: getString(formData, "parentId"),
      deskripsi: getString(formData, "deskripsi") || null,
      is_active: formData.get("isActive"),
    });
  }

  if (kind === "bank-account") {
    return z.object({
      bank_name: z.string().trim().min(2).max(80),
      account_number: z.string().trim().min(3).max(80),
      account_name: z.string().trim().min(2).max(120),
      branch: z.string().trim().max(120).nullable(),
      coa_id: nullableId,
      is_default: activeBoolean,
      is_active: activeBoolean,
      catatan: z.string().trim().max(500).nullable(),
    }).parse({
      bank_name: getString(formData, "bankName"),
      account_number: getString(formData, "accountNumber"),
      account_name: getString(formData, "accountName"),
      branch: getString(formData, "branch") || null,
      coa_id: getString(formData, "coaId"),
      is_default: formData.get("isDefault"),
      is_active: formData.get("isActive"),
      catatan: getString(formData, "catatan") || null,
    });
  }

  if (kind === "bank-integration") {
    return z.object({
      provider: z.string().trim().min(2).max(80),
      bank_code: z.string().trim().min(2).max(40),
      bank_name: z.string().trim().min(2).max(80),
      mode: z.enum(["sandbox", "production"]),
      public_config: z.record(z.string(), z.unknown()),
      secret_setting_keys: z.array(z.string().trim().min(1)).max(12),
      is_active: activeBoolean,
      catatan: z.string().trim().max(500).nullable(),
    }).parse({
      provider: getString(formData, "provider"),
      bank_code: getString(formData, "bankCode"),
      bank_name: getString(formData, "bankName"),
      mode: getString(formData, "mode") || "sandbox",
      public_config: {
        merchant_id: getString(formData, "merchantId") || null,
        callback_path: getString(formData, "callbackPath") || null,
      },
      secret_setting_keys: getString(formData, "secretSettingKeys")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      is_active: formData.get("isActive"),
      catatan: getString(formData, "catatan") || null,
    });
  }

  if (kind === "payment-method") {
    return z.object({
      kode: z.string().trim().min(2).max(40),
      nama: z.string().trim().min(2).max(120),
      tipe: z.enum(["Manual Transfer", "Payment Gateway", "VA Bank"]),
      fee_type: z.enum(["none", "fixed", "percent"]),
      fee_amount: z.coerce.number().min(0),
      instruksi: z.string().trim().max(1000).nullable(),
      bank_account_id: nullableId,
      integration_id: nullableId,
      is_active: activeBoolean,
    }).parse({
      kode: getString(formData, "kode"),
      nama: getString(formData, "nama"),
      tipe: getString(formData, "tipe"),
      fee_type: getString(formData, "feeType") || "none",
      fee_amount: getString(formData, "feeAmount") || 0,
      instruksi: getString(formData, "instruksi") || null,
      bank_account_id: getString(formData, "bankAccountId"),
      integration_id: getString(formData, "integrationId"),
      is_active: formData.get("isActive"),
    });
  }

  if (kind === "scholarship") {
    return z.object({
      kode: z.string().trim().min(2).max(40),
      nama: z.string().trim().min(2).max(120),
      tipe: z.enum(["Beasiswa", "Diskon"]),
      nilai: z.coerce.number().min(0),
      satuan: z.enum(["Nominal", "Persen"]),
      tahun_akademik_id: nullableId,
      prodi_id: nullableId,
      angkatan: z.number().int().nullable(),
      kuota: z.number().int().nullable(),
      is_active: activeBoolean,
      keterangan: z.string().trim().max(500).nullable(),
    }).parse({
      kode: getString(formData, "kode"),
      nama: getString(formData, "nama"),
      tipe: getString(formData, "tipe"),
      nilai: getString(formData, "nilai"),
      satuan: getString(formData, "satuan"),
      tahun_akademik_id: getString(formData, "tahunAkademikId"),
      prodi_id: getString(formData, "prodiId"),
      angkatan: getOptionalInt(formData, "angkatan"),
      kuota: getOptionalInt(formData, "kuota"),
      is_active: formData.get("isActive"),
      keterangan: getString(formData, "keterangan") || null,
    });
  }

  return z.object({
    nama: z.string().trim().min(2).max(120),
    tipe: z.enum(["Pemasukan", "Pengeluaran"]),
    deskripsi: z.string().trim().max(500).nullable(),
    coa_id: nullableId,
    is_active: activeBoolean,
  }).parse({
    nama: getString(formData, "nama"),
    tipe: getString(formData, "tipe"),
    deskripsi: getString(formData, "deskripsi") || null,
    coa_id: getString(formData, "coaId"),
    is_active: formData.get("isActive"),
  });
}

export async function saveFinanceSetupAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan.setup", ["Admin", "Keuangan"]);
  const kind = getString(formData, "kind");
  const id = getString(formData, "id") || null;

  if (!setupKinds.includes(kind as FinanceSetupKind)) {
    setupRedirect("tarif", "error", "Jenis setup tidak valid");
  }

  const setupKind = kind as FinanceSetupKind;

  try {
    const payload = parseSetupPayload(setupKind, formData);
    const saved = await saveFinanceSetupRecord(setupKind, payload, user.id, id);

    await logActivity({
      modul: "Keuangan - Setup",
      aksi: id ? "UPDATE" : "CREATE",
      tableName: setupKind,
      recordId: id || saved.id,
      newData: payload,
    });
  } catch (error) {
    setupRedirect(setupKind, "error", "Gagal menyimpan setup", "Periksa kembali data form.");
  }

  revalidatePath("/dashboard/keuangan");
  setupRedirect(setupKind, "success", "Setup disimpan");
}

export async function deleteFinanceSetupAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan.setup", ["Admin", "Keuangan"]);
  const parsed = z.object({
    kind: z.enum(setupKinds),
    id: requiredId,
  }).safeParse({
    kind: getString(formData, "kind"),
    id: getString(formData, "id"),
  });

  if (!parsed.success) {
    setupRedirect("tarif", "error", "Parameter hapus tidak valid");
  }

  try {
    await softDeleteFinanceSetupRecord(parsed.data.kind, parsed.data.id, user.id);
    await logActivity({
      modul: "Keuangan - Setup",
      aksi: "DELETE",
      tableName: parsed.data.kind,
      recordId: parsed.data.id,
    });
  } catch {
    setupRedirect(parsed.data.kind, "error", "Gagal menghapus setup");
  }

  revalidatePath("/dashboard/keuangan");
  setupRedirect(parsed.data.kind, "success", "Setup dihapus");
}

export async function setActiveAcademicYearAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan.setup", ["Admin", "Keuangan"]);
  const parsed = z.object({ id: requiredId }).safeParse({ id: getString(formData, "id") });

  if (!parsed.success) {
    setupRedirect("periode", "error", "Periode tidak valid");
  }

  try {
    await setActiveAcademicYear(parsed.data.id, user.id);
    await logActivity({
      modul: "Keuangan - Periode",
      aksi: "UPDATE",
      tableName: "tahun_akademik",
      recordId: parsed.data.id,
      newData: { is_aktif: true },
    });
  } catch {
    setupRedirect("periode", "error", "Gagal mengaktifkan periode");
  }

  revalidatePath("/dashboard/keuangan");
  setupRedirect("periode", "success", "Periode aktif diperbarui");
}
