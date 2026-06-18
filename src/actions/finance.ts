"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMahasiswaByUserId } from "@/lib/admin/mahasiswa";
import { withToastParams } from "@/lib/toast-query";
import { requireUser, requireAuthorizedUser } from "@/lib/auth";
import { logActivity } from "@/lib/admin/audit-logger";
import { createAdminClient } from "@/supabase/admin";


import { createTagihan, verifikasiPembayaran, createCashFlow, syncAllStudentsStatus, getStudentLedger, requestFinancePaymentGateway } from "@/lib/admin/finance";

// ... other code ...

export async function requestFinancePaymentGatewayAction(tagihanId: string) {
  const user = await requireUser();

  try {
    const result = await requestFinancePaymentGateway({
      userId: user.id,
      tagihanId,
    });
    
    // Not revalidating path directly, let the UI handle the redirect
    return { success: true, checkoutUrl: result.checkoutUrl };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat request payment gateway." 
    };
  }
}


function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal.";
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
  } catch (error) {
    return { error: getErrorMessage(error) };
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
  } catch (error) {
    return { error: getErrorMessage(error) };
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
        return redirect(withToastParams("/dashboard/keuangan#cashflow", { variant: "error", title: "Transaksi serupa sudah ada untuk hari ini" }));
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

    revalidatePath("/dashboard/keuangan");
    redirect(withToastParams("/dashboard/keuangan", { variant: "success", title: "Transaksi dicatat" }));
  } catch (error) {
    redirect(withToastParams("/dashboard/keuangan", { variant: "error", title: "Gagal mencatat kas", message: getErrorMessage(error) }));
  }
}

export async function createTagihanAction(formData: FormData) {
  await requireAuthorizedUser("keuangan", ["Admin", "Keuangan", "Bendahara"]);

  const values = {
    mahasiswaId: formData.get("mahasiswaId")?.toString() || "",
    tahunAkademikId: formData.get("tahunAkademikId")?.toString() || "",
    jenis: formData.get("jenis")?.toString() || "",
    nominal: Number(formData.get("nominal")),
    jatuhTempo: formData.get("jatuhTempo")?.toString() || "",
  };

  if (!values.mahasiswaId || !values.nominal) {
    return redirect(withToastParams("/dashboard/keuangan#tagihan", { variant: "error", title: "Data tidak lengkap" }));
  }

  try {
    await createTagihan(values);

    // Log Activity
    await logActivity({
      modul: "Keuangan - Tagihan",
      aksi: "CREATE",
      tableName: "tagihan",
      newData: values
    });

    revalidatePath("/dashboard/keuangan");
    return redirect(withToastParams("/dashboard/keuangan#tagihan", { variant: "success", title: "Tagihan dibuat" }));
  } catch (error) {
    return redirect(withToastParams("/dashboard/keuangan#tagihan", { variant: "error", title: "Gagal membuat tagihan", message: getErrorMessage(error) }));
  }
}

export async function verifyPaymentAction(formData: FormData) {
  const user = await requireAuthorizedUser("keuangan", ["Admin", "Keuangan", "Bendahara"]);
  const id = formData.get("id")?.toString() || "";
  const rawStatus = formData.get("status")?.toString();

  if (rawStatus !== "Terverifikasi" && rawStatus !== "Ditolak") {
    return redirect(withToastParams("/dashboard/keuangan#pembayaran", { variant: "error", title: "Status pembayaran tidak valid" }));
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

    revalidatePath("/dashboard/keuangan");
    revalidatePath("/dashboard/master-data/mahasiswa");
    return redirect(withToastParams("/dashboard/keuangan#pembayaran", { variant: "success", title: "Pembayaran diproses" }));
  } catch (error) {
    return redirect(withToastParams("/dashboard/keuangan#pembayaran", { variant: "error", title: "Gagal verifikasi", message: getErrorMessage(error) }));
  }
}
