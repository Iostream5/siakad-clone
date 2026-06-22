"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getMahasiswaByUserId } from "@/lib/admin/mahasiswa";
import { withToastParams } from "@/lib/toast-query";
import { requireUser, requireAuthorizedUser } from "@/lib/auth";
import { logActivity } from "@/lib/admin/audit-logger";
import { createAdminClient } from "@/supabase/admin";


import {
  bulkSoftDeleteTagihan,
  createTagihan,
  importTagihanRows,
  sendOverdueTagihanNotifications,
  sendTagihanNotification,
  updateTagihan,
  verifikasiPembayaran,
  createCashFlow,
  syncAllStudentsStatus,
  getStudentLedger,
  requestFinancePaymentGateway,
  type FinanceTagihanStatus,
  type ImportTagihanInputRow,
  type ImportTagihanMode,
} from "@/lib/admin/finance";

// ... other code ...

const financeSummaryPath = "/dashboard/keuangan?tab=summary";
const financeTagihanPath = "/dashboard/keuangan?tab=tagihan";
const financePembayaranPath = "/dashboard/keuangan?tab=pembayaran";

const tagihanStatusSchema = z.enum(["Belum Lunas", "Lunas", "Dispensasi"]);

const updateTagihanSchema = z.object({
  id: z.string().uuid(),
  mahasiswaId: z.string().uuid(),
  tahunAkademikId: z.string().uuid(),
  jenis: z.string().trim().min(2),
  nominal: z.coerce.number().positive(),
  jatuhTempo: z.string().trim().min(8),
  status: tagihanStatusSchema,
});

const importModeSchema = z.enum(["skip_existing", "update_unpaid"]);

export async function requestFinancePaymentGatewayAction(tagihanId: string) {
  const user = await requireUser();

  try {
    const result = await requestFinancePaymentGateway({
      userId: user.id,
      tagihanId,
    });

    revalidatePath("/dashboard/keuangan");
    revalidatePath("/dashboard/registrasi");
    return { success: true, checkoutUrl: result.checkoutUrl };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat request payment gateway." 
    };
  }
}


function getErrorMessage() {
  return "Terjadi kesalahan sistem. Permintaan gagal diproses.";
}

function getFormString(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? "";
}

function parseSelectedIds(formData: FormData) {
  const fromCsv = getFormString(formData, "selectedIds")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const fromRepeated = formData.getAll("ids").map((item) => item.toString().trim()).filter(Boolean);
  return Array.from(new Set([...fromCsv, ...fromRepeated]));
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      value += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function readRequired(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return typeof value === "string" || typeof value === "number" ? `${value}`.trim() : "";
}

function toImportRows(rawRows: Record<string, unknown>[]): ImportTagihanInputRow[] {
  return rawRows.map((row, index) => {
    const status = readRequired(row, "status") || "Belum Lunas";
    const parsedStatus = tagihanStatusSchema.safeParse(status);

    if (!parsedStatus.success) {
      throw new Error(`Status tidak valid di baris ${index + 2}.`);
    }

    const nominal = Number(readRequired(row, "nominal"));
    if (!Number.isFinite(nominal) || nominal <= 0) {
      throw new Error(`Nominal tidak valid di baris ${index + 2}.`);
    }

    return {
      rowNumber: index + 2,
      nim: readRequired(row, "nim"),
      tahunAkademikKode: readRequired(row, "tahun_akademik_kode"),
      jenis: readRequired(row, "jenis"),
      nominal,
      jatuhTempo: readRequired(row, "jatuh_tempo"),
      masterBiayaNama: readRequired(row, "master_biaya_nama") || null,
      status: parsedStatus.data as FinanceTagihanStatus,
    };
  });
}

async function parseImportFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  let rows: Record<string, unknown>[] = [];

  if (extension === "xlsx" || extension === "xls") {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : null;
    rows = sheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }) : [];
  } else {
    const csvRows = parseCsv(await file.text());
    const headers = (csvRows.shift() ?? []).map(normalizeHeader);
    rows = csvRows.map((values) =>
      headers.reduce<Record<string, unknown>>((acc, header, index) => {
        acc[header] = values[index] ?? "";
        return acc;
      }, {}),
    );
  }

  const normalizedRows = rows.map((row) =>
    Object.entries(row).reduce<Record<string, unknown>>((acc, [key, value]) => {
      acc[normalizeHeader(key)] = value;
      return acc;
    }, {}),
  );

  const requiredHeaders = ["nim", "tahun_akademik_kode", "jenis", "nominal", "jatuh_tempo"];
  const firstRow = normalizedRows[0] ?? {};
  const missingHeaders = requiredHeaders.filter((header) => !(header in firstRow));
  if (missingHeaders.length > 0) {
    throw new Error(`Header wajib kurang: ${missingHeaders.join(", ")}`);
  }

  return toImportRows(normalizedRows);
}

/**
 * Action untuk sinkronisasi status seluruh mahasiswa
 */
export async function syncAllStudentsStatusAction() {
  await requireAuthorizedUser("keuangan", ["Admin", "Keuangan"]);
  try {
    const result = await syncAllStudentsStatus();
    
    // Log Activity
    await logActivity({
      modul: "Sistem - Sinkronisasi",
      aksi: "UPDATE",
      tableName: "mahasiswa",
      newData: { message: `Berhasil sinkronisasi status ${result.count} mahasiswa.` }
    });

    revalidatePath("/dashboard/keuangan");
    revalidatePath("/dashboard/master-data/mahasiswa");
    return { success: true, count: result.count };
  } catch {
    return { error: getErrorMessage() };
  }
}

/**
 * Action untuk mengambil buku besar mahasiswa
 */
export async function getStudentLedgerAction(mahasiswaId: string) {
  const user = await requireAuthorizedUser("keuangan", ["Admin", "Keuangan", "Mahasiswa", "Bendahara", "Pimpinan"]);

  if (user.role === "Mahasiswa") {
    const mahasiswa = await getMahasiswaByUserId(user.id);
    if (!mahasiswa || mahasiswa.id !== mahasiswaId) {
      return { error: "Anda tidak berwenang melihat riwayat pembayaran mahasiswa lain." };
    }
  }

  try {
    const data = await getStudentLedger(mahasiswaId);
    return { success: true, data };
  } catch {
    return { error: getErrorMessage() };
  }
}

export async function createCashFlowAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan", ["Admin", "Keuangan"]);

  const values = {
    tanggal: formData.get("tanggal")?.toString() || "",
    kategoriId: formData.get("kategoriId")?.toString() || "",
    tipe: formData.get("tipe")?.toString() as "Masuk" | "Keluar",
    judul: formData.get("judul")?.toString() || "",
    deskripsi: formData.get("deskripsi")?.toString() || "",
    nominal: Number(formData.get("nominal")),
    userId: user.id,
  };

  try {
    // Check for idempotency locally based on title and nominal for the day
    const supabase = await createAdminClient();
    if (supabase) {
      const today = new Date(values.tanggal || new Date().toISOString()).toISOString().split('T')[0];
      const { data: existingCashFlow } = await supabase
        .from("arus_kas")
        .select("id")
        .eq("judul", values.judul)
        .eq("nominal", values.nominal)
        .eq("tipe", values.tipe)
        .gte("tanggal", `${today}T00:00:00Z`)
        .lte("tanggal", `${today}T23:59:59Z`)
        .limit(1);

      if (existingCashFlow && existingCashFlow.length > 0) {
        throw new Error("DUPLICATE_CASHFLOW");
      }
    }

    await createCashFlow(values);
    
    // Log Activity
    await logActivity({
      modul: "Keuangan - Arus Kas",
      aksi: "CREATE",
      tableName: "arus_kas",
      newData: values
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_CASHFLOW") {
      redirect(withToastParams(financeSummaryPath, { variant: "error", title: "Transaksi serupa sudah ada untuk hari ini" }));
    }
    redirect(withToastParams(financeSummaryPath, { variant: "error", title: "Gagal mencatat kas", message: getErrorMessage() }));
  }

  revalidatePath("/dashboard/keuangan");
  redirect(withToastParams(financeSummaryPath, { variant: "success", title: "Transaksi dicatat" }));
}

export async function createTagihanAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan", ["Admin", "Keuangan", "Bendahara"]);

  const values = {
    mahasiswaId: formData.get("mahasiswaId")?.toString() || "",
    tahunAkademikId: formData.get("tahunAkademikId")?.toString() || "",
    jenis: formData.get("jenis")?.toString() || "",
    nominal: Number(formData.get("nominal")),
    jatuhTempo: formData.get("jatuhTempo")?.toString() || "",
  };

  if (!values.mahasiswaId || !values.tahunAkademikId || !values.jenis || !values.jatuhTempo || !Number.isFinite(values.nominal) || values.nominal <= 0) {
    redirect(withToastParams(financeTagihanPath, { variant: "error", title: "Data tidak lengkap" }));
  }

  try {
    await createTagihan({ ...values, userId: user.id });

    // Log Activity
    await logActivity({
      modul: "Keuangan - Tagihan",
      aksi: "CREATE",
      tableName: "tagihan",
      newData: values
    });
  } catch {
    redirect(withToastParams(financeTagihanPath, { variant: "error", title: "Gagal membuat tagihan", message: getErrorMessage() }));
  }

  revalidatePath("/dashboard/keuangan");
  redirect(withToastParams(financeTagihanPath, { variant: "success", title: "Tagihan dibuat" }));
}

export async function updateTagihanAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan", ["Admin", "Keuangan", "Bendahara"]);
  const parsed = updateTagihanSchema.safeParse({
    id: getFormString(formData, "id"),
    mahasiswaId: getFormString(formData, "mahasiswaId"),
    tahunAkademikId: getFormString(formData, "tahunAkademikId"),
    jenis: getFormString(formData, "jenis"),
    nominal: getFormString(formData, "nominal"),
    jatuhTempo: getFormString(formData, "jatuhTempo"),
    status: getFormString(formData, "status"),
  });

  if (!parsed.success) {
    redirect(withToastParams(financeTagihanPath, { variant: "error", title: "Data tagihan tidak valid" }));
  }

  try {
    await updateTagihan({ ...parsed.data, userId: user.id });
    await logActivity({
      modul: "Keuangan - Tagihan",
      aksi: "UPDATE",
      tableName: "tagihan",
      recordId: parsed.data.id,
      newData: parsed.data,
    });
  } catch (error) {
    redirect(withToastParams(financeTagihanPath, {
      variant: "error",
      title: "Gagal memperbarui tagihan",
      message: error instanceof Error ? error.message : getErrorMessage(),
    }));
  }

  revalidatePath("/dashboard/keuangan");
  redirect(withToastParams(financeTagihanPath, { variant: "success", title: "Tagihan diperbarui" }));
}

export async function bulkSoftDeleteTagihanAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan", ["Admin", "Keuangan", "Bendahara"]);
  const ids = parseSelectedIds(formData);

  if (ids.length === 0) {
    redirect(withToastParams(financeTagihanPath, { variant: "error", title: "Pilih tagihan dulu" }));
  }

  let result: Awaited<ReturnType<typeof bulkSoftDeleteTagihan>>;
  try {
    result = await bulkSoftDeleteTagihan(ids, user.id);
    await logActivity({
      modul: "Keuangan - Tagihan",
      aksi: "DELETE",
      tableName: "tagihan",
      newData: result,
    });
  } catch (error) {
    redirect(withToastParams(financeTagihanPath, {
      variant: "error",
      title: "Gagal menghapus tagihan",
      message: error instanceof Error ? error.message : getErrorMessage(),
    }));
  }

  revalidatePath("/dashboard/keuangan");
  redirect(withToastParams(financeTagihanPath, {
    variant: result.deleted > 0 ? "success" : "error",
    title: `${result.deleted} tagihan dihapus`,
    message: result.skipped > 0 ? `${result.skipped} tagihan dilewati karena tidak memenuhi aturan.` : undefined,
  }));
}

export async function importTagihanAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan", ["Admin", "Keuangan", "Bendahara"]);
  const file = formData.get("file");
  const mode = importModeSchema.safeParse(getFormString(formData, "mode") || "skip_existing");

  if (!(file instanceof File) || file.size === 0) {
    redirect(withToastParams(financeTagihanPath, { variant: "error", title: "File import belum dipilih" }));
  }

  if (!mode.success) {
    redirect(withToastParams(financeTagihanPath, { variant: "error", title: "Mode import tidak valid" }));
  }

  let result: Awaited<ReturnType<typeof importTagihanRows>>;
  try {
    const rows = await parseImportFile(file);
    result = await importTagihanRows(rows, mode.data as ImportTagihanMode, user.id);

    await logActivity({
      modul: "Keuangan - Import Tagihan",
      aksi: "CREATE",
      tableName: "tagihan",
      newData: {
        fileName: file.name,
        mode: mode.data,
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        failed: result.failed,
      },
    });
  } catch (error) {
    redirect(withToastParams(financeTagihanPath, {
      variant: "error",
      title: "Import gagal",
      message: error instanceof Error ? error.message : getErrorMessage(),
    }));
  }

  revalidatePath("/dashboard/keuangan");
  redirect(withToastParams(financeTagihanPath, {
    variant: result.failed > 0 ? "error" : "success",
    title: `Import: ${result.imported} baru, ${result.updated} update`,
    message: `${result.skipped} dilewati, ${result.failed} gagal.`,
  }));
}

export async function sendTagihanNotificationAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan", ["Admin", "Keuangan", "Bendahara"]);
  const ids = parseSelectedIds(formData);

  if (ids.length === 0) {
    redirect(withToastParams(financeTagihanPath, { variant: "error", title: "Pilih tagihan dulu" }));
  }

  let result: Awaited<ReturnType<typeof sendTagihanNotification>>;
  try {
    result = await sendTagihanNotification(ids, "billing.manual_reminder");
    await logActivity({
      modul: "Keuangan - Notifikasi",
      aksi: "CREATE",
      tableName: "notification_queue",
      newData: { sent: result.sent, skipped: result.skipped, selected: ids.length, userId: user.id },
    });
  } catch (error) {
    redirect(withToastParams(financeTagihanPath, {
      variant: "error",
      title: "Gagal mengirim notifikasi",
      message: error instanceof Error ? error.message : getErrorMessage(),
    }));
  }

  revalidatePath("/dashboard/keuangan");
  redirect(withToastParams(financeTagihanPath, {
    variant: "success",
    title: `${result.sent} notifikasi dikirim`,
    message: result.skipped > 0 ? `${result.skipped} tagihan dilewati.` : undefined,
  }));
}

export async function sendOverdueTagihanNotificationsAction() {
  const user = await requireAuthorizedUser("keuangan", ["Admin", "Keuangan", "Bendahara"]);

  let result: Awaited<ReturnType<typeof sendOverdueTagihanNotifications>>;
  try {
    result = await sendOverdueTagihanNotifications();
    await logActivity({
      modul: "Keuangan - Notifikasi",
      aksi: "CREATE",
      tableName: "notification_queue",
      newData: { event: "billing.overdue", sent: result.sent, skipped: result.skipped, userId: user.id },
    });
  } catch (error) {
    redirect(withToastParams(financeTagihanPath, {
      variant: "error",
      title: "Gagal mengirim overdue",
      message: error instanceof Error ? error.message : getErrorMessage(),
    }));
  }

  revalidatePath("/dashboard/keuangan");
  redirect(withToastParams(financeTagihanPath, {
    variant: "success",
    title: `${result.sent} pengingat overdue dikirim`,
  }));
}

export async function verifyPaymentAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan", ["Admin", "Keuangan", "Bendahara"]);
  const id = formData.get("id")?.toString() || "";
  const rawStatus = formData.get("status")?.toString();

  if (rawStatus !== "Terverifikasi" && rawStatus !== "Ditolak") {
    redirect(withToastParams(financePembayaranPath, { variant: "error", title: "Status pembayaran tidak valid" }));
  }

  const status: "Terverifikasi" | "Ditolak" = rawStatus;

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  // Fetch old data for audit log
  const { data: oldPayment } = await supabase.from("pembayaran").select("*").eq("id", id).single();

  try {
    const result = await verifikasiPembayaran(id, user.id, status);

    // Log Activity
    await logActivity({
      modul: "Keuangan - Pembayaran",
      aksi: "APPROVE",
      tableName: "pembayaran",
      recordId: id,
      oldData: oldPayment,
      newData: {
        status,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        mahasiswa_id: result.mahasiswaId,
        status_sync: result.statusSync,
      }
    });
  } catch {
    redirect(withToastParams(financePembayaranPath, { variant: "error", title: "Gagal verifikasi", message: getErrorMessage() }));
  }

  revalidatePath("/dashboard/keuangan");
  revalidatePath("/dashboard/master-data/mahasiswa");
  revalidatePath("/dashboard/registrasi");
  redirect(withToastParams(financePembayaranPath, { variant: "success", title: "Pembayaran diproses" }));
}
