import "server-only";

import { createHash } from "crypto";

import { createAdminClient } from "@/supabase/admin";

type Relation<T> = T | T[] | null | undefined;

export type FinanceTagihanStatus = "Belum Lunas" | "Lunas" | "Dispensasi";
export type FinancePaymentStatus = "Menunggu" | "Terverifikasi" | "Ditolak";
export type MahasiswaStatus = "CALON" | "AKTIF" | "NON-AKTIF" | "CUTI" | "LULUS" | "DO";

type AcademicYearRelation = {
  nama: string | null;
};

type StudentLedgerProfileQuery = {
  id: string;
  nim: string | null;
  angkatan: number | null;
  status_mahasiswa: string | null;
  users: Relation<{
    full_name: string | null;
    email: string | null;
  }>;
  program_studi: Relation<{
    nama: string | null;
  }>;
};

type StudentLedgerBillQuery = {
  id: string;
  jenis: string;
  nominal: number | string;
  jatuh_tempo: string;
  status: FinanceTagihanStatus;
  created_at: string;
  tahun_akademik: Relation<AcademicYearRelation>;
};

type StudentLedgerPaymentQuery = {
  id: string;
  tagihan_id: string;
  tanggal_bayar: string;
  nominal: number | string;
  metode: string;
  bukti_url: string | null;
  verified_at: string | null;
  status: FinancePaymentStatus;
  created_at: string;
  tagihan: Relation<{
    id: string;
    jenis: string;
    nominal: number | string;
    status: FinanceTagihanStatus;
    jatuh_tempo: string;
    tahun_akademik: Relation<AcademicYearRelation>;
  }>;
  verified_user: Relation<{
    full_name: string | null;
  }>;
};

type PaymentVerificationQuery = {
  tagihan_id: string;
  nominal: number | string;
  tagihan: Relation<{
    id: string;
    jenis: string;
    nominal: number | string;
    mahasiswa_id: string;
    mahasiswa: Relation<{
      id: string;
      nim: string | null;
      users: Relation<{
        full_name: string | null;
      }>;
    }>;
  }>;
};

type StudentStatusSyncRow = {
  status_mahasiswa: MahasiswaStatus;
  saldo_tunggakan: number | string | null;
};

type ActiveBillSyncRow = {
  id: string;
  nominal: number | string;
  status: FinanceTagihanStatus;
};

export type StudentLedgerProfile = {
  id: string;
  nim: string | null;
  name: string;
  email: string | null;
  angkatan: number | null;
  status: string | null;
  programStudi: string | null;
};

export type StudentLedgerBill = {
  id: string;
  jenis: string;
  nominal: number;
  jatuh_tempo: string;
  status: FinanceTagihanStatus;
  created_at: string;
  tahun_akademik: AcademicYearRelation | null;
  totalPaid: number;
  remaining: number;
  verifiedPayments: number;
  progressPercent: number;
  lastPaymentAt: string | null;
  isOverdue: boolean;
};

export type StudentLedgerPayment = {
  id: string;
  tagihan_id: string;
  tanggal_bayar: string;
  nominal: number;
  metode: string;
  bukti_url: string | null;
  verified_at: string | null;
  status: FinancePaymentStatus;
  created_at: string;
  tagihan: {
    id: string;
    jenis: string;
    nominal: number;
    status: FinanceTagihanStatus;
    jatuh_tempo: string;
    tahun_akademik: AcademicYearRelation | null;
  } | null;
  verifiedBy: string | null;
};

export type StudentLedgerTimelineItem = {
  id: string;
  type: "tagihan" | "pembayaran";
  date: string;
  title: string;
  description: string;
  amount: number;
  status: FinanceTagihanStatus | FinancePaymentStatus;
};

export type StudentLedgerSummary = {
  totalBilled: number;
  totalVerifiedPaid: number;
  totalPendingPaid: number;
  outstanding: number;
  overdueBills: number;
  unpaidBills: number;
  paidBills: number;
  paymentCount: number;
  lastPaymentAt: string | null;
};

export type StudentLedgerData = {
  mahasiswa: StudentLedgerProfile | null;
  tagihan: StudentLedgerBill[];
  pembayaran: StudentLedgerPayment[];
  timeline: StudentLedgerTimelineItem[];
  summary: StudentLedgerSummary;
};

function pickRelation<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function emptyStudentLedger(): StudentLedgerData {
  return {
    mahasiswa: null,
    tagihan: [],
    pembayaran: [],
    timeline: [],
    summary: {
      totalBilled: 0,
      totalVerifiedPaid: 0,
      totalPendingPaid: 0,
      outstanding: 0,
      overdueBills: 0,
      unpaidBills: 0,
      paidBills: 0,
      paymentCount: 0,
      lastPaymentAt: null,
    },
  };
}

export async function getTagihanList() {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("tagihan")
    .select(`
      *,
      mahasiswa!tagihan_mahasiswa_id_fkey(
        nim,
        users!mahasiswa_user_id_fkey(full_name)
      ),
      tahun_akademik!tagihan_tahun_akademik_id_fkey(nama)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tagihan:", error);
    return [];
  }

  return data || [];
}

export async function getPembayaranList() {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("pembayaran")
    .select(`
      *,
      tagihan!pembayaran_tagihan_id_fkey(
        jenis,
        mahasiswa!tagihan_mahasiswa_id_fkey(
          nim,
          users!mahasiswa_user_id_fkey(full_name)
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pembayaran:", error);
    return [];
  }

  return data || [];
}

export async function createTagihan(values: {
  mahasiswaId: string;
  tahunAkademikId: string;
  jenis: string;
  nominal: number;
  jatuhTempo: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const { error } = await supabase.from("tagihan").insert({
    mahasiswa_id: values.mahasiswaId,
    tahun_akademik_id: values.tahunAkademikId,
    jenis: values.jenis,
    nominal: values.nominal,
    jatuh_tempo: values.jatuhTempo,
    status: "Belum Lunas",
  });

  if (error) throw error;
  return { success: true };
}

export async function getCashFlowList() {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("arus_kas")
    .select(`
      *,
      kategori:kategori_id (nama, tipe)
    `)
    .order("tanggal", { ascending: false });

  if (error) {
    console.error("Error fetching cash flow:", error);
    return [];
  }

  return data || [];
}

export async function getFinanceCategories() {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("kategori_keuangan")
    .select("*")
    .eq("is_active", true);

  if (error) return [];
  return data || [];
}

export async function createCashFlow(values: {
  tanggal: string;
  kategoriId: string;
  tipe: "Masuk" | "Keluar";
  judul: string;
  deskripsi: string;
  nominal: number;
  userId: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const { error } = await supabase.from("arus_kas").insert({
    tanggal: values.tanggal,
    kategori_id: values.kategoriId,
    tipe: values.tipe,
    judul: values.judul,
    deskripsi: values.deskripsi,
    nominal: values.nominal,
    created_by: values.userId,
  });

  if (error) throw error;
  return { success: true };
}

export async function verifikasiPembayaran(pembayaranId: string, verifierId: string, status: "Terverifikasi" | "Ditolak") {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const { data: pembayaran, error: pmbError } = await supabase
    .from("pembayaran")
    .select(`
      tagihan_id,
      nominal,
      tagihan!pembayaran_tagihan_id_fkey(
        id,
        jenis,
        nominal,
        mahasiswa_id,
        mahasiswa!tagihan_mahasiswa_id_fkey(
          id,
          nim,
          users!mahasiswa_user_id_fkey(full_name)
        )
      )
    `)
    .eq("id", pembayaranId)
    .single();

  if (pmbError || !pembayaran) throw new Error("Pembayaran tidak ditemukan");

  const paymentData = pembayaran as PaymentVerificationQuery;
  const tagihanData = pickRelation(paymentData.tagihan);
  const mahasiswaData = pickRelation(tagihanData?.mahasiswa);
  const userData = pickRelation(mahasiswaData?.users);
  const mahasiswaId = tagihanData?.mahasiswa_id ?? mahasiswaData?.id ?? null;

  const { error } = await supabase.from("pembayaran").update({
    status,
    verified_by: verifierId,
    verified_at: new Date().toISOString(),
  }).eq("id", pembayaranId);

  if (error) throw error;

  if (status === "Terverifikasi") {
    // 1. Update tagihan status
    const { data: allPmb } = await supabase
      .from("pembayaran")
      .select("nominal")
      .eq("tagihan_id", paymentData.tagihan_id)
      .eq("status", "Terverifikasi");
    
    const totalPaid = (allPmb || []).reduce((acc, curr) => acc + Number(curr.nominal), 0);
    
    const { data: tagihan } = await supabase
      .from("tagihan")
      .select("nominal")
      .eq("id", paymentData.tagihan_id)
      .single();

    if (tagihan && totalPaid >= Number(tagihan.nominal)) {
      await supabase.from("tagihan").update({ status: "Lunas" }).eq("id", paymentData.tagihan_id);
    }

    // 2. Automagically add to arus_kas
    const { data: category } = await supabase
      .from("kategori_keuangan")
      .select("id")
      .eq("nama", "SPP / UKT Mahasiswa")
      .single();

    await supabase.from("arus_kas").insert({
      tanggal: new Date().toISOString().split('T')[0],
      kategori_id: category?.id,
      tipe: "Masuk",
      judul: `Pembayaran ${tagihanData?.jenis || 'Tagihan'}`,
      deskripsi: `Pembayaran dari ${userData?.full_name || 'Mahasiswa'} (${mahasiswaData?.nim || '-'})`,
      nominal: paymentData.nominal,
      referensi_id: pembayaranId,
      created_by: verifierId,
    });
  }

  const statusSync = mahasiswaId ? await syncStudentStatus(mahasiswaId) : null;

  return { success: true, mahasiswaId, statusSync };
}

export async function getFinanceSummary() {
  const supabase = createAdminClient();
  if (!supabase) return { balance: 0, income: 0, expense: 0 };

  const { data: incomeData } = await supabase.from("arus_kas").select("nominal").eq("tipe", "Masuk");
  const { data: expenseData } = await supabase.from("arus_kas").select("nominal").eq("tipe", "Keluar");

  const totalIncome = (incomeData || []).reduce((acc, curr) => acc + Number(curr.nominal), 0);
  const totalExpense = (expenseData || []).reduce((acc, curr) => acc + Number(curr.nominal), 0);

  return {
    balance: totalIncome - totalExpense,
    income: totalIncome,
    expense: totalExpense,
  };
}

/**
 * Mengambil riwayat keuangan lengkap (Buku Besar) per Mahasiswa
 */
export async function getStudentLedger(mahasiswaId: string): Promise<StudentLedgerData> {
  const supabase = createAdminClient();
  if (!supabase) return emptyStudentLedger();

  const [mahasiswaRes, tagihanRes, pembayaranRes] = await Promise.all([
    supabase
      .from("mahasiswa")
      .select(`
        id, nim, angkatan, status_mahasiswa,
        users!mahasiswa_user_id_fkey(full_name, email),
        program_studi!mahasiswa_prodi_id_fkey(nama)
      `)
      .eq("id", mahasiswaId)
      .maybeSingle(),
    supabase
      .from("tagihan")
      .select(`
        id, jenis, nominal, jatuh_tempo, status, created_at,
        tahun_akademik!tagihan_tahun_akademik_id_fkey(nama)
      `)
      .eq("mahasiswa_id", mahasiswaId)
      .order("created_at", { ascending: false }),
    supabase
      .from("pembayaran")
      .select(`
        id, tagihan_id, tanggal_bayar, nominal, metode, bukti_url, verified_at, status, created_at,
        tagihan!inner(
          id, jenis, nominal, status, jatuh_tempo,
          tahun_akademik!tagihan_tahun_akademik_id_fkey(nama)
        ),
        verified_user:users!pembayaran_verified_by_fkey(full_name)
      `)
      .eq("tagihan.mahasiswa_id", mahasiswaId)
      .order("tanggal_bayar", { ascending: false })
  ]);

  if (mahasiswaRes.error) throw mahasiswaRes.error;
  if (tagihanRes.error) throw tagihanRes.error;
  if (pembayaranRes.error) throw pembayaranRes.error;

  const mahasiswaRow = mahasiswaRes.data as StudentLedgerProfileQuery | null;
  const mahasiswaUser = pickRelation(mahasiswaRow?.users);
  const mahasiswaProdi = pickRelation(mahasiswaRow?.program_studi);
  const mahasiswa: StudentLedgerProfile | null = mahasiswaRow
    ? {
        id: mahasiswaRow.id,
        nim: mahasiswaRow.nim,
        name: mahasiswaUser?.full_name ?? "Mahasiswa",
        email: mahasiswaUser?.email ?? null,
        angkatan: mahasiswaRow.angkatan,
        status: mahasiswaRow.status_mahasiswa,
        programStudi: mahasiswaProdi?.nama ?? null,
      }
    : null;

  const rawPayments = (pembayaranRes.data ?? []) as StudentLedgerPaymentQuery[];
  const pembayaran: StudentLedgerPayment[] = rawPayments.map((item) => {
    const tagihan = pickRelation(item.tagihan);
    const tahunAkademik = pickRelation(tagihan?.tahun_akademik);
    const verifiedUser = pickRelation(item.verified_user);

    return {
      id: item.id,
      tagihan_id: item.tagihan_id,
      tanggal_bayar: item.tanggal_bayar,
      nominal: Number(item.nominal),
      metode: item.metode,
      bukti_url: item.bukti_url,
      verified_at: item.verified_at,
      status: item.status,
      created_at: item.created_at,
      tagihan: tagihan
        ? {
            id: tagihan.id,
            jenis: tagihan.jenis,
            nominal: Number(tagihan.nominal),
            status: tagihan.status,
            jatuh_tempo: tagihan.jatuh_tempo,
            tahun_akademik: tahunAkademik,
          }
        : null,
      verifiedBy: verifiedUser?.full_name ?? null,
    };
  });

  const paidByBill = new Map<string, { total: number; count: number; lastPaymentAt: string | null }>();
  for (const payment of pembayaran) {
    if (payment.status !== "Terverifikasi") continue;
    const current = paidByBill.get(payment.tagihan_id) ?? { total: 0, count: 0, lastPaymentAt: null };
    const latest = current.lastPaymentAt && new Date(current.lastPaymentAt) > new Date(payment.tanggal_bayar)
      ? current.lastPaymentAt
      : payment.tanggal_bayar;
    paidByBill.set(payment.tagihan_id, {
      total: current.total + payment.nominal,
      count: current.count + 1,
      lastPaymentAt: latest,
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tagihan: StudentLedgerBill[] = ((tagihanRes.data ?? []) as StudentLedgerBillQuery[]).map((item) => {
    const paid = paidByBill.get(item.id) ?? { total: 0, count: 0, lastPaymentAt: null };
    const nominal = Number(item.nominal);
    const remaining = Math.max(nominal - paid.total, 0);
    const dueDate = new Date(item.jatuh_tempo);

    return {
      id: item.id,
      jenis: item.jenis,
      nominal,
      jatuh_tempo: item.jatuh_tempo,
      status: item.status,
      created_at: item.created_at,
      tahun_akademik: pickRelation(item.tahun_akademik),
      totalPaid: paid.total,
      remaining,
      verifiedPayments: paid.count,
      progressPercent: nominal > 0 ? Math.min(100, Math.round((paid.total / nominal) * 100)) : 0,
      lastPaymentAt: paid.lastPaymentAt,
      isOverdue: item.status !== "Lunas" && dueDate < today,
    };
  });

  const totalBilled = tagihan.reduce((sum, item) => sum + item.nominal, 0);
  const totalVerifiedPaid = pembayaran
    .filter((item) => item.status === "Terverifikasi")
    .reduce((sum, item) => sum + item.nominal, 0);
  const totalPendingPaid = pembayaran
    .filter((item) => item.status === "Menunggu")
    .reduce((sum, item) => sum + item.nominal, 0);
  const lastPaymentAt = pembayaran[0]?.tanggal_bayar ?? null;

  const timeline: StudentLedgerTimelineItem[] = [
    ...tagihan.map((item) => ({
      id: `tagihan-${item.id}`,
      type: "tagihan" as const,
      date: item.created_at,
      title: item.jenis,
      description: `Tagihan ${item.tahun_akademik?.nama ?? "tahun akademik"} dibuat`,
      amount: item.nominal,
      status: item.status,
    })),
    ...pembayaran.map((item) => ({
      id: `pembayaran-${item.id}`,
      type: "pembayaran" as const,
      date: item.tanggal_bayar,
      title: `Pembayaran ${item.tagihan?.jenis ?? "Tagihan"}`,
      description: item.verifiedBy
        ? `${item.metode} - diverifikasi oleh ${item.verifiedBy}`
        : item.metode,
      amount: item.nominal,
      status: item.status,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    mahasiswa,
    tagihan,
    pembayaran,
    timeline,
    summary: {
      totalBilled,
      totalVerifiedPaid,
      totalPendingPaid,
      outstanding: Math.max(totalBilled - totalVerifiedPaid, 0),
      overdueBills: tagihan.filter((item) => item.isOverdue).length,
      unpaidBills: tagihan.filter((item) => item.status !== "Lunas").length,
      paidBills: tagihan.filter((item) => item.status === "Lunas").length,
      paymentCount: pembayaran.length,
      lastPaymentAt,
    },
  };
}

/**
 * Sinkronisasi status mahasiswa berdasarkan pembayaran semester aktif
 */
export async function syncStudentStatus(mahasiswaId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const [{ data: activeYear }, { data: mahasiswa, error: mahasiswaError }] = await Promise.all([
    supabase
      .from("tahun_akademik")
      .select("id")
      .eq("is_aktif", true)
      .maybeSingle(),
    supabase
      .from("mahasiswa")
      .select("status_mahasiswa, saldo_tunggakan")
      .eq("id", mahasiswaId)
      .maybeSingle(),
  ]);

  if (mahasiswaError) throw mahasiswaError;
  if (!mahasiswa) throw new Error("Mahasiswa tidak ditemukan");
  if (!activeYear) {
    return {
      success: true,
      status: (mahasiswa as StudentStatusSyncRow).status_mahasiswa,
      changed: false,
      reason: "NO_ACTIVE_ACADEMIC_YEAR",
    };
  }

  const currentStudent = mahasiswa as StudentStatusSyncRow;
  const currentStatus = currentStudent.status_mahasiswa;
  const { data: activeBills, error: billsError } = await supabase
    .from("tagihan")
    .select("id, nominal, status")
    .eq("mahasiswa_id", mahasiswaId)
    .eq("tahun_akademik_id", activeYear.id);

  if (billsError) throw billsError;

  const bills = (activeBills ?? []) as ActiveBillSyncRow[];
  if (bills.length === 0) {
    return {
      success: true,
      status: currentStatus,
      changed: false,
      outstanding: Number(currentStudent.saldo_tunggakan ?? 0),
      reason: "NO_ACTIVE_BILLS",
    };
  }

  const billIds = bills.map((item) => item.id);
  const { data: verifiedPayments, error: paymentsError } = await supabase
    .from("pembayaran")
    .select("tagihan_id, nominal")
    .in("tagihan_id", billIds)
    .eq("status", "Terverifikasi");

  if (paymentsError) throw paymentsError;

  const paidByBill = new Map<string, number>();
  for (const payment of verifiedPayments ?? []) {
    paidByBill.set(payment.tagihan_id, (paidByBill.get(payment.tagihan_id) ?? 0) + Number(payment.nominal));
  }

  const outstanding = bills.reduce((total, bill) => {
    if (bill.status !== "Belum Lunas") return total;
    const remaining = Math.max(Number(bill.nominal) - (paidByBill.get(bill.id) ?? 0), 0);
    return total + remaining;
  }, 0);

  const preservedStatuses: MahasiswaStatus[] = ["CUTI", "LULUS", "DO"];
  const nextStatus: MahasiswaStatus = preservedStatuses.includes(currentStatus)
    ? currentStatus
    : outstanding > 0
      ? "NON-AKTIF"
      : "AKTIF";
  const statusChanged = currentStatus !== nextStatus;
  const balanceChanged = Math.abs(Number(currentStudent.saldo_tunggakan ?? 0) - outstanding) >= 1;

  if (statusChanged || balanceChanged) {
    const { error: updateError } = await supabase
      .from("mahasiswa")
      .update({
        status_mahasiswa: nextStatus,
        saldo_tunggakan: outstanding,
      })
      .eq("id", mahasiswaId);

    if (updateError) throw updateError;
  }

  if (statusChanged) {
    const { error: historyError } = await supabase.from("riwayat_status_mahasiswa").insert({
      id_mahasiswa: mahasiswaId,
      status_lama: currentStatus,
      status_baru: nextStatus,
    });

    if (historyError) throw historyError;
  }

  return {
    success: true,
    status: nextStatus,
    oldStatus: currentStatus,
    changed: statusChanged,
    outstanding,
  };
}

/**
 * Sinkronisasi massal status seluruh mahasiswa aktif
 */
export async function syncAllStudentsStatus() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const { data: mahasiswa } = await supabase
    .from("mahasiswa")
    .select("id")
    .is("deleted_at", null);

  if (!mahasiswa) return { count: 0 };

  for (const m of mahasiswa) {
    await syncStudentStatus(m.id);
  }

  return { count: mahasiswa.length };
}

/**
 * Finance Payment Gateway (Midtrans)
 */

type MidtransConfig = {
  provider: "midtrans";
  serverKey: string;
  snapUrl: string;
  isProduction: boolean;
};

type MidtransFinanceNotificationPayload = {
  order_id?: unknown;
  status_code?: unknown;
  gross_amount?: unknown;
  signature_key?: unknown;
  transaction_status?: unknown;
  fraud_status?: unknown;
  transaction_id?: unknown;
};

const MIDTRANS_SANDBOX_SNAP_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";
const MIDTRANS_PRODUCTION_SNAP_URL = "https://app.midtrans.com/snap/v1/transactions";

async function getMidtransConfig(): Promise<MidtransConfig | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: settings, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["payment.midtrans.enabled", "payment.midtrans.server_key", "payment.midtrans.is_production"]);

  if (error || !settings) return null;

  const enabledSetting = settings.find(s => s.key === "payment.midtrans.enabled")?.value as any;
  const isEnabled = enabledSetting?.value === true;
  
  if (!isEnabled) return null;

  const serverKeySetting = settings.find(s => s.key === "payment.midtrans.server_key")?.value as any;
  const serverKey = serverKeySetting?.value?.trim();
  
  if (!serverKey) return null;

  const isProductionSetting = settings.find(s => s.key === "payment.midtrans.is_production")?.value as any;
  const isProduction = isProductionSetting?.value === true;

  return {
    provider: "midtrans",
    serverKey,
    snapUrl: isProduction ? MIDTRANS_PRODUCTION_SNAP_URL : MIDTRANS_SANDBOX_SNAP_URL,
    isProduction,
  };
}

function getPublicAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (configured?.trim()) return configured.trim().replace(/\/+$/, "");
  const vercelUrl = process.env.VERCEL_URL?.trim();
  return vercelUrl ? `https://${vercelUrl.replace(/\/+$/, "")}` : null;
}

export async function requestFinancePaymentGateway(values: {
  userId: string;
  tagihanId: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const midtrans = await getMidtransConfig();
  if (!midtrans) {
    throw new Error("Payment gateway belum aktif. Harap hubungi bagian keuangan.");
  }

  // 1. Ambil data tagihan & mahasiswa
  const { data: tagihan, error } = await supabase
    .from("tagihan")
    .select(`
      id, jenis, nominal, status,
      mahasiswa:mahasiswa_id(id, nim, user_id, users:user_id(full_name, email))
    `)
    .eq("id", values.tagihanId)
    .single();

  if (error || !tagihan) {
    throw new Error("Tagihan tidak ditemukan.");
  }

  const mahasiswaData = pickRelation(tagihan.mahasiswa);
  if (mahasiswaData?.user_id !== values.userId) {
    throw new Error("Akses ditolak. Tagihan ini bukan milik Anda.");
  }

  if (tagihan.status === "Lunas") {
    throw new Error("Tagihan sudah lunas.");
  }

  const amount = Number(tagihan.nominal);

  // 2. Cek apakah sudah ada pembayaran pending dengan checkout_url
  const { data: existingPayment } = await supabase
    .from("pembayaran")
    .select("id, checkout_url, provider")
    .eq("tagihan_id", tagihan.id)
    .eq("metode", "Payment Gateway")
    .eq("status", "Menunggu")
    .not("checkout_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPayment?.checkout_url) {
    return {
      provider: existingPayment.provider ?? midtrans.provider,
      paymentId: existingPayment.id,
      checkoutUrl: existingPayment.checkout_url as string,
    };
  }

  const userData = pickRelation(mahasiswaData?.users);
  const orderId = `TAG-${tagihan.id.slice(0, 8)}-${Date.now()}`;
  const appUrl = getPublicAppUrl();

  const requestBody = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(amount),
    },
    customer_details: {
      first_name: userData?.full_name || "Mahasiswa",
      email: userData?.email || "mahasiswa@stai.edu",
    },
    item_details: [
      {
        id: tagihan.id.slice(0, 10),
        price: Math.round(amount),
        quantity: 1,
        name: tagihan.jenis,
      },
    ],
    callbacks: appUrl
      ? {
          finish: `${appUrl}/dashboard/keuangan?tab=tagihan`,
        }
      : undefined,
  };

  const response = await fetch(midtrans.snapUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${midtrans.serverKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  let snapResponse: any = {};
  try {
    snapResponse = JSON.parse(responseText);
  } catch {}

  if (!response.ok || !snapResponse.redirect_url) {
    throw new Error(`Gagal membuat checkout Midtrans: ${responseText || response.statusText}`);
  }

  const { data: payment, error: paymentError } = await supabase
    .from("pembayaran")
    .insert({
      tagihan_id: tagihan.id,
      nominal: amount,
      metode: "Payment Gateway",
      provider: midtrans.provider,
      provider_reference: orderId,
      checkout_url: snapResponse.redirect_url,
      status: "Menunggu",
    })
    .select("id")
    .single();

  if (paymentError) throw paymentError;

  return {
    provider: midtrans.provider,
    paymentId: payment.id,
    checkoutUrl: snapResponse.redirect_url,
  };
}

function normalizeMidtransValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? `${value}`.trim() : "";
}

export async function handleMidtransFinanceNotification(payload: MidtransFinanceNotificationPayload) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const midtrans = await getMidtransConfig();
  if (!midtrans) {
    throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
  }

  const orderId = normalizeMidtransValue(payload.order_id);
  const statusCode = normalizeMidtransValue(payload.status_code);
  const grossAmount = normalizeMidtransValue(payload.gross_amount);
  const signatureKey = normalizeMidtransValue(payload.signature_key);

  if (!orderId || !statusCode || !grossAmount || !signatureKey) {
    throw new Error("Payload notifikasi Midtrans tidak lengkap.");
  }

  const expected = createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${midtrans.serverKey}`).digest("hex");
  if (expected !== signatureKey) {
    throw new Error("Signature Midtrans tidak valid.");
  }

  // Idempotency check
  const eventId = String(payload.transaction_id || payload.order_id || Date.now());
  const { data: existingEvent } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("provider", "midtrans")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existingEvent) {
    return {
      received: true,
      ignored: true,
      reason: "Webhook event already processed",
    };
  }

  await supabase.from("webhook_events").insert({
    provider: "midtrans",
    event_id: eventId,
    event_type: String(payload.transaction_status),
    payload: payload as any,
  });

  const transactionStatus = normalizeMidtransValue(payload.transaction_status);
  const fraudStatus = normalizeMidtransValue(payload.fraud_status);

  let mappedStatus: "Menunggu" | "Terverifikasi" | "Ditolak" | "Kadaluarsa" | "Gagal" | null = null;
  if (transactionStatus === "capture") {
    mappedStatus = fraudStatus === "challenge" ? "Menunggu" : "Terverifikasi";
  } else if (transactionStatus === "settlement") {
    mappedStatus = "Terverifikasi";
  } else if (transactionStatus === "pending") {
    mappedStatus = "Menunggu";
  } else if (transactionStatus === "expire") {
    mappedStatus = "Kadaluarsa";
  } else if (["cancel", "deny", "failure"].includes(transactionStatus)) {
    mappedStatus = "Gagal";
  } else if (["refund", "partial_refund"].includes(transactionStatus)) {
    mappedStatus = "Gagal";
  }

  if (!mappedStatus) {
    return { received: true, ignored: true, reason: `Status tidak dikenali: ${transactionStatus}` };
  }

  const { data: payment, error } = await supabase
    .from("pembayaran")
    .select("id, tagihan_id, nominal, status")
    .eq("provider", "midtrans")
    .eq("provider_reference", orderId)
    .maybeSingle();

  if (error) throw error;
  if (!payment) throw new Error("Data pembayaran tidak ditemukan.");

  const isAlreadyVerified = payment.status === "Terverifikasi";

  const { error: updatePaymentError } = await supabase
    .from("pembayaran")
    .update({
      status: mappedStatus,
      verified_at: mappedStatus === "Terverifikasi" ? new Date().toISOString() : null,
    })
    .eq("id", payment.id);

  if (updatePaymentError) throw updatePaymentError;

  if (mappedStatus === "Terverifikasi" && !isAlreadyVerified) {
    const { data: allPmb } = await supabase
      .from("pembayaran")
      .select("nominal")
      .eq("tagihan_id", payment.tagihan_id)
      .eq("status", "Terverifikasi");
    
    const totalPaid = (allPmb || []).reduce((acc, curr) => acc + Number(curr.nominal), 0);
    
    const { data: tagihan } = await supabase
      .from("tagihan")
      .select("nominal, jenis, mahasiswa:mahasiswa_id(id, nim, users:user_id(full_name))")
      .eq("id", payment.tagihan_id)
      .single();

    if (tagihan && totalPaid >= Number(tagihan.nominal)) {
      await supabase.from("tagihan").update({ status: "Lunas" }).eq("id", payment.tagihan_id);
    }

    const { data: category } = await supabase
      .from("kategori_keuangan")
      .select("id")
      .eq("nama", "SPP / UKT Mahasiswa")
      .maybeSingle();

    const mhsData = pickRelation(tagihan?.mahasiswa);
    const userData = pickRelation(mhsData?.users);

    await supabase.from("arus_kas").insert({
      tanggal: new Date().toISOString().split('T')[0],
      kategori_id: category?.id ?? null,
      tipe: "Masuk",
      judul: `Pembayaran ${tagihan?.jenis || 'Tagihan'} via Gateway`,
      deskripsi: `Pembayaran dari ${userData?.full_name || 'Mahasiswa'} (${mhsData?.nim || '-'}) via Midtrans`,
      nominal: payment.nominal,
      referensi_id: payment.id,
      created_by: null, 
    });
  }

  return {
    received: true,
    paymentId: payment.id,
    status: mappedStatus,
  };
}
