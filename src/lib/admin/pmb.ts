import "server-only";

import { createHash, randomUUID } from "crypto";

import { createAdminClient } from "@/supabase/admin";

const PMB_DOCUMENT_BUCKET = "pmb-documents";
const PMB_PAYMENT_PROOF_BUCKET = "pmb-payment-proofs";
const DEFAULT_PMB_REGISTRATION_FEE = 250000;
const DEFAULT_PMB_INVOICE_DUE_DAYS = 3;
const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024;
const MAX_PAYMENT_PROOF_SIZE = 3 * 1024 * 1024;
const ALLOWED_DOCUMENT_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png"]);
const MIDTRANS_SANDBOX_SNAP_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";
const MIDTRANS_PRODUCTION_SNAP_URL = "https://app.midtrans.com/snap/v1/transactions";

const documentLabels = {
  identity: "Identitas diri",
  diploma: "Ijazah / SKL",
  photo: "Pas foto",
} as const;

type PmbDocumentKey = keyof typeof documentLabels;

export type PmbDocumentUploads = Partial<Record<PmbDocumentKey, File | null>>;

type UploadedPmbDocument = {
  label: string;
  name: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: string;
};

export type PmbPaymentStatus = "pending" | "paid" | "expired" | "failed" | "refund" | "manual_review";
export type PmbManualPaymentStatus = "Menunggu" | "Terverifikasi" | "Ditolak" | "Kadaluarsa" | "Gagal";

export type PmbFeeRow = {
  id: string;
  tahun_akademik_id: string;
  prodi_id: string | null;
  nama: string;
  jalur_pendaftaran: string;
  jenis_pendaftaran: string;
  gelombang: string | null;
  nominal: number | string;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  due_days: number;
  is_active: boolean;
  catatan: string | null;
  created_at: string;
  updated_at: string;
  tahun_akademik?: {
    kode?: string | null;
    nama?: string | null;
  } | null;
  program_studi?: {
    nama?: string | null;
  } | null;
};

export type PmbFeeInput = {
  tahunAkademikId: string;
  prodiId?: string | null;
  nama: string;
  jalurPendaftaran: string;
  jenisPendaftaran: string;
  gelombang?: string | null;
  nominal: number;
  tanggalMulai?: string | null;
  tanggalSelesai?: string | null;
  dueDays: number;
  isActive: boolean;
  catatan?: string | null;
};

type ResolvedPmbFee = {
  id: string | null;
  name: string;
  nominal: number;
  dueDays: number;
};

type MidtransConfig = {
  provider: "midtrans";
  serverKey: string;
  snapUrl: string;
  isProduction: boolean;
};

type MidtransNotificationPayload = {
  order_id?: unknown;
  status_code?: unknown;
  gross_amount?: unknown;
  signature_key?: unknown;
  transaction_status?: unknown;
  fraud_status?: unknown;
  payment_type?: unknown;
  transaction_id?: unknown;
};

type MidtransSnapResponse = {
  token?: string;
  redirect_url?: string;
};

export type PmbPaymentRow = {
  id: string;
  pmb_pendaftaran_id: string;
  tanggal_bayar: string;
  nominal: number | string;
  metode: "Transfer Bank" | "Payment Gateway";
  bank_pengirim: string | null;
  nama_pengirim: string | null;
  bukti_url: string | null;
  bukti_signed_url?: string | null;
  provider: string | null;
  provider_reference: string | null;
  checkout_url: string | null;
  status: PmbManualPaymentStatus;
  catatan: string | null;
  created_at: string;
};

export type PmbPaymentPortalData = {
  registration: (PmbRegistrationRow & {
    program_studi?: { nama?: string | null } | null;
    pmb_biaya?: { nama?: string | null } | null;
  }) | null;
  payments: PmbPaymentRow[];
  gateway: {
    enabled: boolean;
    provider: "midtrans" | "xendit" | null;
    message: string;
  };
};

type PmbRegistrationRow = {
  id: string;
  user_id: string | null;
  nomor_pendaftaran: string;
  nama_lengkap: string;
  email: string;
  no_hp: string | null;
  prodi_pilihan_id: string | null;
  status_pendaftaran: string | null;
  status_pembayaran: string | null;
  status_seleksi: string;
  invoice_number: string | null;
  invoice_amount: number | string | null;
  invoice_due_at: string | null;
  pmb_biaya_id: string | null;
  created_at: string;
};

function createReference(prefix: string) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const token = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `${prefix}-${dateStr}-${token}`;
}

function getProgramName(program: unknown) {
  if (!program || typeof program !== "object") return "Unknown";
  if (Array.isArray(program)) return getProgramName(program[0]);
  if ("nama" in program && typeof program.nama === "string") return program.nama;
  return "Unknown";
}

function normalizeEmpty(value?: string | null) {
  const normalized = (value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function isUniversal(value: string | null | undefined) {
  return !value || value === "Semua";
}

function dateScore(value: string | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}

function isFeeCurrentlyValid(fee: PmbFeeRow, today: string) {
  if (fee.tanggal_mulai && fee.tanggal_mulai > today) return false;
  if (fee.tanggal_selesai && fee.tanggal_selesai < today) return false;
  return true;
}

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function getContentType(file: File) {
  if (file.type) return file.type;

  const extension = getFileExtension(file.name);
  if (extension === "pdf") return "application/pdf";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  return "application/octet-stream";
}

function sanitizeFileName(fileName: string) {
  const extension = getFileExtension(fileName);
  const baseName = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${baseName || "dokumen"}.${extension || "bin"}`;
}

async function ensureStorageBucket(supabase: NonNullable<ReturnType<typeof createAdminClient>>, bucket: string) {
  const { error } = await supabase.storage.getBucket(bucket);
  if (!error) return;

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: false,
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw createError;
  }
}

async function ensureDocumentBucket(supabase: NonNullable<ReturnType<typeof createAdminClient>>) {
  await ensureStorageBucket(supabase, PMB_DOCUMENT_BUCKET);
}

async function ensurePaymentProofBucket(supabase: NonNullable<ReturnType<typeof createAdminClient>>) {
  await ensureStorageBucket(supabase, PMB_PAYMENT_PROOF_BUCKET);
}

async function uploadPmbDocument(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  registrationNumber: string,
  key: PmbDocumentKey,
  file: File | null | undefined,
): Promise<UploadedPmbDocument | null> {
  if (!file || file.size === 0) return null;

  const extension = getFileExtension(file.name);
  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(extension)) {
    throw new Error(`${documentLabels[key]} harus berupa PDF, JPG, atau PNG`);
  }

  if (file.size > MAX_DOCUMENT_SIZE) {
    throw new Error(`${documentLabels[key]} maksimal 2MB`);
  }

  await ensureDocumentBucket(supabase);

  const fileName = sanitizeFileName(file.name);
  const path = `${registrationNumber}/${key}-${Date.now()}-${fileName}`;
  const body = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(PMB_DOCUMENT_BUCKET).upload(path, body, {
    contentType: getContentType(file),
    upsert: true,
  });

  if (error) throw error;

  return {
    label: documentLabels[key],
    name: file.name,
    path,
    size: file.size,
    type: getContentType(file),
    uploadedAt: new Date().toISOString(),
  };
}

async function uploadPmbDocuments(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  registrationNumber: string,
  documents?: PmbDocumentUploads,
) {
  const entries = await Promise.all(
    (Object.keys(documentLabels) as PmbDocumentKey[]).map(async (key) => {
      const uploaded = await uploadPmbDocument(supabase, registrationNumber, key, documents?.[key]);
      return [key, uploaded] as const;
    }),
  );

  return entries.reduce<Record<string, UploadedPmbDocument>>((acc, [key, uploaded]) => {
    if (uploaded) acc[key] = uploaded;
    return acc;
  }, {});
}

async function uploadPmbPaymentProof(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  registrationNumber: string,
  file: File | null | undefined,
) {
  if (!file || file.size === 0) {
    throw new Error("Bukti transfer wajib diunggah.");
  }

  const extension = getFileExtension(file.name);
  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(extension)) {
    throw new Error("Bukti transfer harus berupa PDF, JPG, atau PNG.");
  }

  if (file.size > MAX_PAYMENT_PROOF_SIZE) {
    throw new Error("Bukti transfer maksimal 3MB.");
  }

  await ensurePaymentProofBucket(supabase);

  const fileName = sanitizeFileName(file.name);
  const path = `${registrationNumber}/${Date.now()}-${fileName}`;
  const body = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(PMB_PAYMENT_PROOF_BUCKET).upload(path, body, {
    contentType: getContentType(file),
    upsert: true,
  });

  if (error) throw error;
  return path;
}

async function signPaymentProofUrls(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  payments: PmbPaymentRow[],
) {
  return Promise.all(
    payments.map(async (payment) => {
      if (!payment.bukti_url) return { ...payment, bukti_signed_url: null };

      const { data } = await supabase.storage
        .from(PMB_PAYMENT_PROOF_BUCKET)
        .createSignedUrl(payment.bukti_url, 60 * 30);

      return {
        ...payment,
        bukti_signed_url: data?.signedUrl ?? null,
      };
    }),
  );
}

function createTemporaryPassword() {
  return `Pmb@${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

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

async function getPmbGatewayState(): Promise<PmbPaymentPortalData["gateway"]> {
  const midtrans = await getMidtransConfig();
  if (midtrans) {
    return {
      enabled: true,
      provider: "midtrans",
      message: `Payment gateway MIDTRANS ${midtrans.isProduction ? "production" : "sandbox"} siap digunakan.`,
    };
  }

  if (process.env.XENDIT_SECRET_KEY?.trim()) {
    return {
      enabled: false,
      provider: null,
      message: "Xendit key terdeteksi, tetapi alur PMB saat ini direkomendasikan memakai Midtrans Snap.",
    };
  }

  return {
    enabled: false,
    provider: null,
    message: "Payment gateway belum aktif. Gunakan transfer bank dan upload bukti untuk saat ini.",
  };
}

function normalizeMidtransString(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? `${value}` : "";
}

function verifyMidtransSignature(payload: MidtransNotificationPayload, serverKey: string) {
  const orderId = normalizeMidtransString(payload.order_id);
  const statusCode = normalizeMidtransString(payload.status_code);
  const grossAmount = normalizeMidtransString(payload.gross_amount);
  const signatureKey = normalizeMidtransString(payload.signature_key);

  if (!orderId || !statusCode || !grossAmount || !signatureKey) {
    throw new Error("Payload notifikasi Midtrans tidak lengkap.");
  }

  const expected = createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest("hex");
  if (expected !== signatureKey) {
    throw new Error("Signature Midtrans tidak valid.");
  }
}

function mapMidtransStatus(payload: MidtransNotificationPayload): PmbManualPaymentStatus | null {
  const transactionStatus = normalizeMidtransString(payload.transaction_status);
  const fraudStatus = normalizeMidtransString(payload.fraud_status);

  if (transactionStatus === "capture") {
    return fraudStatus === "challenge" ? "Menunggu" : "Terverifikasi";
  }
  if (transactionStatus === "settlement") return "Terverifikasi";
  if (transactionStatus === "pending") return "Menunggu";
  if (transactionStatus === "expire") return "Kadaluarsa";
  if (["cancel", "deny", "failure"].includes(transactionStatus)) return "Gagal";
  if (["refund", "partial_refund"].includes(transactionStatus)) return "Gagal";

  return null;
}

function getNestedRegistrationName(value: unknown) {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return "Calon Mahasiswa";
  if ("nama_lengkap" in row && typeof row.nama_lengkap === "string") return row.nama_lengkap;
  return "Calon Mahasiswa";
}

async function recordPmbPaymentIncome(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  values: {
    paymentId: string;
    nominal: number | string;
    registrationName: string;
    createdBy?: string | null;
  },
) {
  const { data: existingCash } = await supabase
    .from("arus_kas")
    .select("id")
    .eq("referensi_id", values.paymentId)
    .maybeSingle();

  if (existingCash) return;

  const { data: category } = await supabase
    .from("kategori_keuangan")
    .select("id")
    .eq("nama", "Biaya Pendaftaran PMB")
    .maybeSingle();

  const { error } = await supabase.from("arus_kas").insert({
    tanggal: new Date().toISOString().split("T")[0],
    kategori_id: category?.id,
    tipe: "Masuk",
    judul: "Pembayaran PMB",
    deskripsi: `Pembayaran PMB dari ${values.registrationName}`,
    nominal: values.nominal,
    referensi_id: values.paymentId,
    created_by: values.createdBy ?? null,
  });

  if (error) throw error;
}

export async function getPmbFeeList(): Promise<PmbFeeRow[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("pmb_biaya")
    .select(`
      *,
      tahun_akademik:tahun_akademik_id(kode, nama),
      program_studi:prodi_id(nama)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching PMB fee list:", error);
    return [];
  }

  return (data ?? []) as PmbFeeRow[];
}

async function resolvePmbFee(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  params: {
    programId: string;
    registrationPath: string;
    registrationType: string;
  },
): Promise<ResolvedPmbFee> {
  const today = new Date().toISOString().slice(0, 10);
  const activeYearResult = await supabase
    .from("tahun_akademik")
    .select("id")
    .eq("is_aktif", true)
    .maybeSingle();

  const activeYearId = activeYearResult.data?.id as string | undefined;
  const feeResult = await supabase
    .from("pmb_biaya")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const fees = ((feeResult.data ?? []) as PmbFeeRow[])
    .filter((fee) => isFeeCurrentlyValid(fee, today))
    .filter((fee) => fee.prodi_id === null || fee.prodi_id === params.programId)
    .filter((fee) => fee.jalur_pendaftaran === params.registrationPath || isUniversal(fee.jalur_pendaftaran))
    .filter((fee) => fee.jenis_pendaftaran === params.registrationType || isUniversal(fee.jenis_pendaftaran));

  const [selectedFee] = fees.sort((left, right) => {
    const leftScore =
      (activeYearId && left.tahun_akademik_id === activeYearId ? 20 : 0) +
      (left.prodi_id === params.programId ? 10 : 0) +
      (left.jalur_pendaftaran === params.registrationPath ? 5 : 0) +
      (left.jenis_pendaftaran === params.registrationType ? 5 : 0);
    const rightScore =
      (activeYearId && right.tahun_akademik_id === activeYearId ? 20 : 0) +
      (right.prodi_id === params.programId ? 10 : 0) +
      (right.jalur_pendaftaran === params.registrationPath ? 5 : 0) +
      (right.jenis_pendaftaran === params.registrationType ? 5 : 0);

    if (rightScore !== leftScore) return rightScore - leftScore;
    return dateScore(right.tanggal_mulai) - dateScore(left.tanggal_mulai);
  });

  if (!selectedFee) {
    return {
      id: null,
      name: "Biaya Pendaftaran PMB",
      nominal: DEFAULT_PMB_REGISTRATION_FEE,
      dueDays: DEFAULT_PMB_INVOICE_DUE_DAYS,
    };
  }

  return {
    id: selectedFee.id,
    name: selectedFee.nama,
    nominal: Number(selectedFee.nominal),
    dueDays: selectedFee.due_days || DEFAULT_PMB_INVOICE_DUE_DAYS,
  };
}

export async function savePmbFee(input: PmbFeeInput, id?: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  if (!input.tahunAkademikId) throw new Error("Tahun akademik wajib dipilih.");
  if (!input.nama || input.nama.trim().length < 3) throw new Error("Nama biaya wajib diisi.");
  if (!input.jalurPendaftaran) throw new Error("Jalur pendaftaran wajib dipilih.");
  if (!input.jenisPendaftaran) throw new Error("Jenis pendaftaran wajib dipilih.");
  if (!Number.isFinite(input.nominal) || input.nominal < 0) throw new Error("Nominal biaya tidak valid.");
  if (!Number.isInteger(input.dueDays) || input.dueDays < 1 || input.dueDays > 60) {
    throw new Error("Jatuh tempo invoice harus 1 sampai 60 hari.");
  }
  if (input.tanggalMulai && input.tanggalSelesai && input.tanggalSelesai < input.tanggalMulai) {
    throw new Error("Tanggal selesai harus sesudah tanggal mulai.");
  }

  const payload = {
    tahun_akademik_id: input.tahunAkademikId,
    prodi_id: normalizeEmpty(input.prodiId),
    nama: input.nama.trim(),
    jalur_pendaftaran: input.jalurPendaftaran,
    jenis_pendaftaran: input.jenisPendaftaran,
    gelombang: normalizeEmpty(input.gelombang),
    nominal: input.nominal,
    tanggal_mulai: normalizeEmpty(input.tanggalMulai),
    tanggal_selesai: normalizeEmpty(input.tanggalSelesai),
    due_days: input.dueDays,
    is_active: input.isActive,
    catatan: normalizeEmpty(input.catatan),
  };

  const result = id
    ? await supabase.from("pmb_biaya").update(payload).eq("id", id)
    : await supabase.from("pmb_biaya").insert(payload);

  if (result.error) throw new Error(result.error.message);

  return payload;
}

export async function deletePmbFee(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const { error } = await supabase.from("pmb_biaya").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

async function createOrUpdateCandidateAccount(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  values: {
    fullName: string;
    email: string;
    registrationNumber: string;
  },
) {
  const password = createTemporaryPassword();
  const existingUser = await supabase
    .from("users")
    .select("id, role")
    .eq("email", values.email)
    .maybeSingle();

  if (existingUser.error) throw existingUser.error;

  if (existingUser.data && existingUser.data.role !== "Calon Mahasiswa") {
    throw new Error("Email sudah terdaftar sebagai pengguna aktif. Gunakan email lain atau hubungi admin.");
  }

  let userId = existingUser.data?.id as string | undefined;

  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: {
        role: "Calon Mahasiswa",
        full_name: values.fullName,
        nomor_pendaftaran: values.registrationNumber,
      },
    });

    if (error) throw error;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: values.email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "Calon Mahasiswa",
        full_name: values.fullName,
        nomor_pendaftaran: values.registrationNumber,
      },
    });

    if (error) throw error;
    userId = data.user.id;
  }

  const { error: upsertError } = await supabase.from("users").upsert({
    id: userId,
    email: values.email,
    full_name: values.fullName,
    role: "Calon Mahasiswa",
    is_active: true,
  });

  if (upsertError) throw upsertError;

  const { error: roleError } = await supabase.from("user_roles").upsert(
    {
      user_id: userId,
      role: "Calon Mahasiswa",
    },
    { onConflict: "user_id,role" },
  );

  if (roleError) throw roleError;

  return {
    userId,
    email: values.email,
    password,
  };
}

export async function createPmbRegistration(values: {
  fullName: string;
  email: string;
  phone: string;
  programId: string;
  registrationPath: string;
  registrationType: string;
  birthPlace: string;
  birthDate: string;
  gender: "Laki-laki" | "Perempuan";
  address: string;
  educationLevel: string;
  schoolName: string;
  schoolMajor: string;
  graduationYear: number;
  city: string;
  fatherName: string;
  fatherJob: string;
  motherName: string;
  motherJob: string;
  parentPhone: string;
  notes?: string;
  documents?: PmbDocumentUploads;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const registrationNumber = createReference("PMB");
  const invoiceNumber = registrationNumber.replace("PMB-", "INV-PMB-");
  const fee = await resolvePmbFee(supabase, {
    programId: values.programId,
    registrationPath: values.registrationPath,
    registrationType: values.registrationType,
  });
  const invoiceDueAt = new Date(Date.now() + fee.dueDays * 24 * 60 * 60 * 1000).toISOString();
  const documents = await uploadPmbDocuments(supabase, registrationNumber, values.documents);
  const candidateAccount = await createOrUpdateCandidateAccount(supabase, {
    fullName: values.fullName,
    email: values.email,
    registrationNumber,
  });

  const { data, error } = await supabase
    .from("pmb_pendaftaran")
    .insert({
      nomor_pendaftaran: registrationNumber,
      nama_lengkap: values.fullName,
      email: values.email,
      no_hp: values.phone,
      user_id: candidateAccount.userId,
      login_email: candidateAccount.email,
      login_created_at: new Date().toISOString(),
      prodi_pilihan_id: values.programId,
      jalur_pendaftaran: values.registrationPath,
      jenis_pendaftaran: values.registrationType,
      tempat_lahir: values.birthPlace,
      tanggal_lahir: values.birthDate,
      jenis_kelamin: values.gender,
      alamat: values.address,
      kota_asal: values.city,
      pendidikan_terakhir: values.educationLevel,
      asal_sekolah: values.schoolName,
      jurusan_sekolah: values.schoolMajor,
      tahun_lulus: values.graduationYear,
      nama_ayah: values.fatherName,
      pekerjaan_ayah: values.fatherJob,
      nama_ibu: values.motherName,
      pekerjaan_ibu: values.motherJob,
      no_hp_orang_tua: values.parentPhone,
      dokumen: documents,
      catatan_panitia: values.notes,
      status_seleksi: "BARU",
      status_pendaftaran: "Waiting Payment",
      status_pembayaran: "pending",
      invoice_number: invoiceNumber,
      invoice_amount: fee.nominal,
      invoice_due_at: invoiceDueAt,
      pmb_biaya_id: fee.id,
    })
    .select("nomor_pendaftaran, nama_lengkap, email, invoice_number, invoice_amount, invoice_due_at, program_studi!pmb_pendaftaran_prodi_pilihan_id_fkey(nama)")
    .single();

  if (error) throw error;

  return {
    registrationNumber: data.nomor_pendaftaran,
    fullName: data.nama_lengkap,
    email: data.email,
    program: getProgramName(data.program_studi),
    invoiceNumber: data.invoice_number,
    invoiceAmount: Number(data.invoice_amount ?? fee.nominal),
    invoiceDueAt: data.invoice_due_at,
    loginEmail: candidateAccount.email,
    temporaryPassword: candidateAccount.password,
  };
}

export async function getPmbList() {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("pmb_pendaftaran")
    .select(`
      *,
      program_studi!pmb_pendaftaran_prodi_pilihan_id_fkey(nama),
      pmb_pembayaran(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching PMB list:", error);
    return [];
  }

  const rows = data ?? [];
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      pmb_pembayaran: await signPaymentProofUrls(supabase, ((row.pmb_pembayaran ?? []) as PmbPaymentRow[])),
    })),
  );
}

export async function updatePmbStatus(id: string, status: "BARU" | "VERIFIKASI" | "LULUS" | "DITOLAK", skor?: number) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const updateData: Record<string, unknown> = {
    status_seleksi: status,
    status_pendaftaran:
      status === "LULUS"
        ? "Accepted"
        : status === "DITOLAK"
          ? "Rejected"
          : status === "VERIFIKASI"
            ? "Verified"
            : "Submitted",
  };

  if (typeof skor === "number" && Number.isFinite(skor)) {
    updateData.skor_seleksi = skor;
  }

  if (status === "VERIFIKASI") updateData.verified_at = new Date().toISOString();
  if (status === "LULUS") updateData.accepted_at = new Date().toISOString();

  const { error } = await supabase.from("pmb_pendaftaran").update(updateData).eq("id", id);

  if (error) throw error;
  return { success: true };
}

export async function updatePmbPaymentStatus(id: string, status: PmbPaymentStatus) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const updateData: Record<string, unknown> = {
    status_pembayaran: status,
  };

  if (status === "paid") {
    updateData.status_pendaftaran = "Verified";
    updateData.status_seleksi = "VERIFIKASI";
    updateData.verified_at = new Date().toISOString();
  } else if (status === "pending") {
    updateData.status_pendaftaran = "Waiting Payment";
  } else if (status === "expired" || status === "failed" || status === "refund") {
    updateData.status_pendaftaran = "Submitted";
  }

  const { error } = await supabase.from("pmb_pendaftaran").update(updateData).eq("id", id);
  if (error) throw error;

  return { success: true };
}

export async function getPmbPaymentPortal(userId: string): Promise<PmbPaymentPortalData> {
  const supabase = createAdminClient();
  if (!supabase) {
    return {
      registration: null,
      payments: [],
      gateway: { enabled: false, provider: null, message: "Supabase admin client tidak tersedia." },
    };
  }

  const { data: registration, error } = await supabase
    .from("pmb_pendaftaran")
    .select(`
      *,
      program_studi!pmb_pendaftaran_prodi_pilihan_id_fkey(nama),
      pmb_biaya:pmb_biaya_id(nama)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const { data: payments, error: paymentsError } = registration?.id
    ? await supabase
        .from("pmb_pembayaran")
        .select("*")
        .eq("pmb_pendaftaran_id", registration.id)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (paymentsError) throw paymentsError;

  const signedPayments = await signPaymentProofUrls(supabase, (payments ?? []) as PmbPaymentRow[]);
  const gateway = await getPmbGatewayState();

  return {
    registration: registration as PmbPaymentPortalData["registration"],
    payments: signedPayments,
    gateway,
  };
}

export async function submitPmbTransferPayment(values: {
  userId: string;
  pmbRegistrationId: string;
  nominal: number;
  bankPengirim: string;
  namaPengirim: string;
  proofFile: File | null;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const { data: registration, error } = await supabase
    .from("pmb_pendaftaran")
    .select("id, user_id, nomor_pendaftaran, invoice_amount, status_pembayaran")
    .eq("id", values.pmbRegistrationId)
    .maybeSingle();

  if (error) throw error;
  if (!registration || registration.user_id !== values.userId) {
    throw new Error("Invoice PMB tidak ditemukan untuk akun ini.");
  }
  if (registration.status_pembayaran === "paid") {
    throw new Error("Invoice PMB sudah lunas.");
  }
  if (!Number.isFinite(values.nominal) || values.nominal <= 0) {
    throw new Error("Nominal pembayaran tidak valid.");
  }

  const proofPath = await uploadPmbPaymentProof(supabase, registration.nomor_pendaftaran, values.proofFile);
  const { error: paymentError } = await supabase.from("pmb_pembayaran").insert({
    pmb_pendaftaran_id: registration.id,
    nominal: values.nominal,
    metode: "Transfer Bank",
    bank_pengirim: values.bankPengirim,
    nama_pengirim: values.namaPengirim,
    bukti_url: proofPath,
    status: "Menunggu",
  });

  if (paymentError) throw paymentError;

  const { error: updateError } = await supabase
    .from("pmb_pendaftaran")
    .update({
      status_pembayaran: "manual_review",
      status_pendaftaran: "Waiting Payment",
    })
    .eq("id", registration.id);

  if (updateError) throw updateError;

  return { success: true };
}

export async function requestPmbPaymentGateway(values: {
  userId: string;
  pmbRegistrationId: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const midtrans = await getMidtransConfig();
  if (!midtrans) {
    throw new Error("Payment gateway belum aktif. Isi MIDTRANS_SERVER_KEY untuk mengaktifkan checkout Midtrans.");
  }

  const { data: registration, error } = await supabase
    .from("pmb_pendaftaran")
    .select("id, user_id, nomor_pendaftaran, nama_lengkap, email, no_hp, invoice_number, invoice_amount, status_pembayaran")
    .eq("id", values.pmbRegistrationId)
    .maybeSingle();

  if (error) throw error;
  if (!registration || registration.user_id !== values.userId) {
    throw new Error("Invoice PMB tidak ditemukan untuk akun ini.");
  }

  if (registration.status_pembayaran === "paid") {
    throw new Error("Invoice PMB sudah lunas.");
  }

  const { data: existingPayment, error: existingPaymentError } = await supabase
    .from("pmb_pembayaran")
    .select("id, checkout_url, provider")
    .eq("pmb_pendaftaran_id", registration.id)
    .eq("metode", "Payment Gateway")
    .eq("status", "Menunggu")
    .not("checkout_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPaymentError) throw existingPaymentError;
  if (existingPayment?.checkout_url) {
    return {
      provider: existingPayment.provider ?? midtrans.provider,
      paymentId: existingPayment.id,
      checkoutUrl: existingPayment.checkout_url as string,
    };
  }

  const amount = Number(registration.invoice_amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Nominal invoice PMB tidak valid.");
  }

  const orderId = `PMB-${registration.nomor_pendaftaran}-${Date.now()}`;
  const appUrl = getPublicAppUrl();
  const requestBody = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(amount),
    },
    customer_details: {
      first_name: registration.nama_lengkap,
      email: registration.email,
      phone: registration.no_hp ?? undefined,
    },
    item_details: [
      {
        id: registration.invoice_number ?? registration.nomor_pendaftaran,
        price: Math.round(amount),
        quantity: 1,
        name: "Biaya Pendaftaran PMB",
      },
    ],
    callbacks: appUrl
      ? {
          finish: `${appUrl}/dashboard/keuangan?tab=pmb`,
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
  let snapResponse: MidtransSnapResponse;

  try {
    snapResponse = JSON.parse(responseText) as MidtransSnapResponse;
  } catch {
    snapResponse = {};
  }

  if (!response.ok || !snapResponse.redirect_url) {
    throw new Error(`Gagal membuat checkout Midtrans: ${responseText || response.statusText}`);
  }

  const { data: payment, error: paymentError } = await supabase
    .from("pmb_pembayaran")
    .insert({
      pmb_pendaftaran_id: registration.id,
      nominal: amount,
      metode: "Payment Gateway",
      provider: midtrans.provider,
      provider_reference: orderId,
      checkout_url: snapResponse.redirect_url,
      status: "Menunggu",
      catatan: "Midtrans Snap checkout dibuat.",
    })
    .select("id")
    .single();

  if (paymentError) throw paymentError;

  const { error: updateError } = await supabase
    .from("pmb_pendaftaran")
    .update({
      status_pembayaran: "pending",
      status_pendaftaran: "Waiting Payment",
    })
    .eq("id", registration.id);

  if (updateError) throw updateError;

  return {
    provider: midtrans.provider,
    paymentId: payment.id,
    checkoutUrl: snapResponse.redirect_url,
  };
}

export async function handleMidtransPmbNotification(payload: MidtransNotificationPayload) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const midtrans = await getMidtransConfig();
  if (!midtrans) {
    throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
  }

  verifyMidtransSignature(payload, midtrans.serverKey);

  // Idempotency Check using webhook_events table
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

  const orderId = normalizeMidtransString(payload.order_id);
  const transactionStatus = normalizeMidtransString(payload.transaction_status);
  const paymentType = normalizeMidtransString(payload.payment_type);
  const transactionId = normalizeMidtransString(payload.transaction_id);
  const mappedStatus = mapMidtransStatus(payload);

  if (!mappedStatus) {
    return {
      received: true,
      ignored: true,
      reason: `Status Midtrans tidak dikenali: ${transactionStatus || "-"}`,
    };
  }

  const { data: payment, error } = await supabase
    .from("pmb_pembayaran")
    .select("*, pmb_pendaftaran:pmb_pendaftaran_id(id, nama_lengkap)")
    .eq("provider", "midtrans")
    .eq("provider_reference", orderId)
    .maybeSingle();

  if (error) throw error;
  if (!payment) throw new Error("Pembayaran PMB dari Midtrans tidak ditemukan.");

  const isAlreadyVerified = payment.status === "Terverifikasi";
  const paymentNote = [
    `Midtrans status: ${transactionStatus || "-"}`,
    paymentType ? `metode: ${paymentType}` : null,
    transactionId ? `transaction_id: ${transactionId}` : null,
  ]
    .filter(Boolean)
    .join("; ");

  const { error: updatePaymentError } = await supabase
    .from("pmb_pembayaran")
    .update({
      status: mappedStatus,
      catatan: paymentNote,
      verified_at: mappedStatus === "Terverifikasi" ? new Date().toISOString() : payment.verified_at,
    })
    .eq("id", payment.id);

  if (updatePaymentError) throw updatePaymentError;

  if (mappedStatus === "Terverifikasi" && !isAlreadyVerified) {
    const { error: registrationUpdateError } = await supabase
      .from("pmb_pendaftaran")
      .update({
        status_pembayaran: "paid",
        status_pendaftaran: "Verified",
        status_seleksi: "VERIFIKASI",
        verified_at: new Date().toISOString(),
      })
      .eq("id", payment.pmb_pendaftaran_id);

    if (registrationUpdateError) throw registrationUpdateError;

    await recordPmbPaymentIncome(supabase, {
      paymentId: payment.id,
      nominal: payment.nominal,
      registrationName: getNestedRegistrationName(payment.pmb_pendaftaran),
    });
  }

  if (mappedStatus === "Kadaluarsa" || mappedStatus === "Gagal") {
    const { error: registrationUpdateError } = await supabase
      .from("pmb_pendaftaran")
      .update({
        status_pembayaran: mappedStatus === "Kadaluarsa" ? "expired" : "failed",
        status_pendaftaran: "Submitted",
      })
      .eq("id", payment.pmb_pendaftaran_id)
      .neq("status_pembayaran", "paid");

    if (registrationUpdateError) throw registrationUpdateError;
  }

  return {
    received: true,
    paymentId: payment.id,
    status: mappedStatus,
  };
}

export async function verifyPmbPayment(paymentId: string, verifierId: string, status: "Terverifikasi" | "Ditolak") {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const { data: payment, error } = await supabase
    .from("pmb_pembayaran")
    .select("*, pmb_pendaftaran:pmb_pendaftaran_id(id, nama_lengkap, invoice_amount)")
    .eq("id", paymentId)
    .maybeSingle();

  if (error) throw error;
  if (!payment) throw new Error("Pembayaran PMB tidak ditemukan.");

  const { error: paymentUpdateError } = await supabase
    .from("pmb_pembayaran")
    .update({
      status,
      verified_by: verifierId,
      verified_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  if (paymentUpdateError) throw paymentUpdateError;

  if (status === "Terverifikasi") {
    const { error: registrationUpdateError } = await supabase
      .from("pmb_pendaftaran")
      .update({
        status_pembayaran: "paid",
        status_pendaftaran: "Verified",
        status_seleksi: "VERIFIKASI",
        verified_at: new Date().toISOString(),
      })
      .eq("id", payment.pmb_pendaftaran_id);

    if (registrationUpdateError) throw registrationUpdateError;

    await recordPmbPaymentIncome(supabase, {
      paymentId,
      nominal: payment.nominal,
      registrationName: getNestedRegistrationName(payment.pmb_pendaftaran),
      createdBy: verifierId,
    });
  }

  if (status === "Ditolak") {
    const { error: registrationUpdateError } = await supabase
      .from("pmb_pendaftaran")
      .update({
        status_pembayaran: "pending",
        status_pendaftaran: "Waiting Payment",
      })
      .eq("id", payment.pmb_pendaftaran_id);

    if (registrationUpdateError) throw registrationUpdateError;
  }

  return { success: true };
}

export async function generateNimAndCreateStudent(pmbId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  // 1. Get PMB data
  const { data: pmb, error: pmbError } = await supabase
    .from("pmb_pendaftaran")
    .select("*")
    .eq("id", pmbId)
    .single();

  if (pmbError || !pmb) throw new Error("Data pendaftaran tidak ditemukan");
  if (pmb.status_seleksi !== "LULUS") throw new Error("Hanya pendaftar LULUS yang bisa digenerate NIM");
  if (pmb.generated_nim) throw new Error("NIM sudah pernah digenerate untuk pendaftar ini");

  const angkatan = new Date().getFullYear();

  // 2. Call SQL function to generate NIM
  const { data: nim, error: nimError } = await supabase.rpc("generate_nim", {
    p_pendaftaran_id: pmbId,
    p_angkatan: angkatan,
  });

  if (nimError) throw nimError;

  let userId = pmb.user_id as string | null;

  if (userId) {
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        full_name: pmb.nama_lengkap,
        role: "Mahasiswa",
        nim,
      },
    });

    if (authUpdateError) throw authUpdateError;
  } else {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: pmb.email,
      password: "mhs" + nim,
      email_confirm: true,
      user_metadata: {
        full_name: pmb.nama_lengkap,
        role: "Mahasiswa",
        nim,
      },
    });

    if (authError) throw authError;
    userId = authData.user.id;
  }

  const { error: profileError } = await supabase.from("users").upsert({
    id: userId,
    email: pmb.email,
    full_name: pmb.nama_lengkap,
    role: "Mahasiswa",
    is_active: true,
  });

  if (profileError) throw profileError;

  await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "Calon Mahasiswa");
  const { error: roleError } = await supabase.from("user_roles").upsert(
    {
      user_id: userId,
      role: "Mahasiswa",
    },
    { onConflict: "user_id,role" },
  );

  if (roleError) throw roleError;

  // 4. Create Mahasiswa record
  const { error: mhsError } = await supabase.from("mahasiswa").insert({
    user_id: userId,
    nim: nim,
    angkatan: angkatan,
    prodi_id: pmb.prodi_pilihan_id,
    nama_ibu_kandung: pmb.nama_ibu,
    tempat_lahir: pmb.tempat_lahir,
    tanggal_lahir: pmb.tanggal_lahir,
    status_mahasiswa: "AKTIF",
  });

  if (mhsError) {
    throw mhsError;
  }

  await supabase
    .from("pmb_pendaftaran")
    .update({
      status_pendaftaran: "Registered",
      registered_at: new Date().toISOString(),
      user_id: userId,
    })
    .eq("id", pmbId);

  return { nim };
}
