import "server-only";

import { createAdminClient } from "@/supabase/admin";

export type RegistrasiStatus = "BELUM" | "MENUNGGU" | "LUNAS" | "DISPENSASI";

export type RegistrasiRow = {
  id: string;
  mahasiswa_id: string;
  tahun_akademik_id: string;
  status: RegistrasiStatus;
  tagihan_id: string | null;
  catatan: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  mahasiswa?: {
    nim: string | null;
    status_mahasiswa: string;
    prodi_id?: string;
    users?: {
      full_name: string;
    } | null;
    program_studi?: {
      nama: string;
    } | null;
  } | null;
  tahun_akademik?: {
    kode: string;
    nama: string;
    semester: string;
  } | null;
  tagihan?: {
    nominal: number;
    status: string;
  } | null;
  verifier?: {
    full_name: string;
  } | null;
};

type RegistrasiBaseRow = Omit<RegistrasiRow, "mahasiswa" | "tahun_akademik" | "tagihan" | "verifier">;
type SupabaseClient = NonNullable<ReturnType<typeof createAdminClient>>;

export type ListRegistrasiParams = {
  tahunAkademikId?: string;
  mahasiswaId?: string;
  userId?: string;
  prodiId?: string;
  status?: RegistrasiStatus;
  query?: string;
};

type RelationValue<T> = T | T[] | null | undefined;

type LegacyRegistrasiRow = {
  id: string;
  id_mahasiswa: string;
  id_tahun_akademik: string;
  status: "Belum" | "Proses" | "Selesai" | string;
  tanggal?: string | null;
  created_at: string;
};

type MahasiswaRelationRow = {
  id: string;
  nim: string | null;
  status_mahasiswa: string;
  prodi_id: string;
  users: RelationValue<{ full_name: string }>;
  program_studi: RelationValue<{ nama: string }>;
};

type PaidTagihanRow = {
  id: string;
  mahasiswa_id: string | null;
  tahun_akademik_id: string | null;
  status: string;
  deleted_at: string | null;
};

type ExistingRegistrasiSyncRow = {
  id: string;
  status?: RegistrasiStatus;
  verified_by: string | null;
  verified_at: string | null;
};

type ActiveMahasiswaRow = {
  id: string;
};

export type GenerateRegistrasiForActiveMahasiswaInput = {
  tahunAkademikId: string;
  prodiId?: string | null;
  createdBy?: string | null;
};

function firstRelation<T>(value: RelationValue<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function logRegistrasiError(context: string, error: { code?: string; message?: string; hint?: string | null } | null) {
  if (!error) return;
  console.error(`[registrasi] ${context} failed`, {
    code: error.code,
    message: error.message,
    hint: error.hint,
  });
}

function throwRegistrasiLoadError() {
  throw new Error("Gagal memuat data registrasi semester.");
}

function normalizeStatus(status: string): RegistrasiStatus {
  if (status === "Belum") return "BELUM";
  if (status === "Proses") return "MENUNGGU";
  if (status === "Selesai") return "LUNAS";
  return status as RegistrasiStatus;
}

function isFinalRegistrasiStatus(status: string | null | undefined) {
  return status === "LUNAS" || status === "DISPENSASI";
}

async function syncRegistrasiByTagihanStatus(
  supabase: SupabaseClient,
  tagihanId: string,
  status: RegistrasiStatus,
  options: { verifiedBy?: string | null; verifiedAt?: string | null } = {},
) {
  const tagihanResult = await getTagihanForRegistrasiSync(supabase, tagihanId);
  const bill = tagihanResult.bill;
  if (tagihanResult.skipped || !bill) {
    return { success: true, skipped: true, reason: tagihanResult.reason, tagihanId };
  }

  const current = await getExistingRegistrasiForBill(supabase, bill);
  const payload = {
    status,
    tagihan_id: bill.id,
    verified_by: options.verifiedBy ?? current?.verified_by ?? null,
    verified_at: options.verifiedAt ?? current?.verified_at ?? null,
    updated_at: new Date().toISOString(),
  };

  const writeQuery = current
    ? supabase
        .from("registrasi_semester")
        .update(payload)
        .eq("id", current.id)
        .select("id")
        .single()
    : supabase
        .from("registrasi_semester")
        .insert({
          mahasiswa_id: bill.mahasiswa_id,
          tahun_akademik_id: bill.tahun_akademik_id,
          ...payload,
        })
        .select("id")
        .single();

  const { data: registrasi, error: writeError } = await writeQuery;
  if (writeError) {
    logRegistrasiError(`sync ${status.toLowerCase()} registrasi`, writeError);
    throw new Error("Gagal menyinkronkan registrasi semester.");
  }

  return {
    success: true,
    skipped: false,
    registrasiId: registrasi?.id ?? current?.id ?? null,
    tagihanId,
    mahasiswaId: bill.mahasiswa_id,
    tahunAkademikId: bill.tahun_akademik_id,
  };
}

export async function syncRegistrasiFromCreatedTagihan(tagihanId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Database error");

  return syncRegistrasiByTagihanStatus(supabase, tagihanId, "BELUM");
}

async function getTagihanForRegistrasiSync(supabase: SupabaseClient, tagihanId: string) {
  const { data: tagihan, error } = await supabase
    .from("tagihan")
    .select("id, mahasiswa_id, tahun_akademik_id, status, deleted_at")
    .eq("id", tagihanId)
    .maybeSingle();

  if (error) {
    logRegistrasiError("sync tagihan query", error);
    throw new Error("Gagal membaca tagihan untuk registrasi semester.");
  }

  const bill = tagihan as PaidTagihanRow | null;
  if (!bill) {
    return { bill: null, skipped: true, reason: "TAGIHAN_NOT_FOUND" as const };
  }

  if (bill.deleted_at) {
    return { bill, skipped: true, reason: "TAGIHAN_DELETED" as const };
  }

  if (!bill.mahasiswa_id || !bill.tahun_akademik_id) {
    console.warn("[registrasi] sync skipped: tagihan missing mahasiswa/tahun akademik", {
      tagihanId,
      mahasiswaId: bill.mahasiswa_id,
      tahunAkademikId: bill.tahun_akademik_id,
    });
    return { bill, skipped: true, reason: "TAGIHAN_INCOMPLETE" as const };
  }

  return { bill, skipped: false, reason: null };
}

async function getExistingRegistrasiForBill(supabase: SupabaseClient, bill: PaidTagihanRow) {
  const { data: existing, error } = await supabase
    .from("registrasi_semester")
    .select("id, status, verified_by, verified_at")
    .eq("mahasiswa_id", bill.mahasiswa_id)
    .eq("tahun_akademik_id", bill.tahun_akademik_id)
    .maybeSingle();

  if (error) {
    logRegistrasiError("sync existing registrasi query", error);
    throw new Error("Gagal membaca registrasi semester.");
  }

  return existing as ExistingRegistrasiSyncRow | null;
}

export async function generateRegistrasiForActiveMahasiswa(input: GenerateRegistrasiForActiveMahasiswaInput) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Database error");

  void input.createdBy;

  let mahasiswaQuery = supabase
    .from("mahasiswa")
    .select("id")
    .eq("status_mahasiswa", "AKTIF")
    .is("deleted_at", null);

  if (input.prodiId) {
    mahasiswaQuery = mahasiswaQuery.eq("prodi_id", input.prodiId);
  }

  const { data: mahasiswaRows, error: mahasiswaError } = await mahasiswaQuery;
  if (mahasiswaError) {
    logRegistrasiError("generate active mahasiswa query", mahasiswaError);
    throw new Error("Gagal membaca mahasiswa aktif.");
  }

  const mahasiswaIds = ((mahasiswaRows ?? []) as ActiveMahasiswaRow[]).map((item) => item.id);
  if (mahasiswaIds.length === 0) {
    return { success: true, totalEligible: 0, created: 0, skipped: 0 };
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("registrasi_semester")
    .select("mahasiswa_id")
    .eq("tahun_akademik_id", input.tahunAkademikId)
    .in("mahasiswa_id", mahasiswaIds);

  if (existingError) {
    logRegistrasiError("generate existing registrasi query", existingError);
    throw new Error("Gagal membaca data registrasi yang sudah ada.");
  }

  const existingIds = new Set((existingRows ?? []).map((item) => item.mahasiswa_id as string));
  const payload = mahasiswaIds
    .filter((mahasiswaId) => !existingIds.has(mahasiswaId))
    .map((mahasiswaId) => ({
      mahasiswa_id: mahasiswaId,
      tahun_akademik_id: input.tahunAkademikId,
      status: "BELUM" as const,
    }));

  if (payload.length === 0) {
    return {
      success: true,
      totalEligible: mahasiswaIds.length,
      created: 0,
      skipped: existingIds.size,
    };
  }

  const { error: insertError } = await supabase.from("registrasi_semester").insert(payload);
  if (insertError) {
    logRegistrasiError("generate insert registrasi", insertError);
    throw new Error("Gagal membuat data daftar ulang.");
  }

  return {
    success: true,
    totalEligible: mahasiswaIds.length,
    created: payload.length,
    skipped: existingIds.size,
  };
}

function legacyStatus(status: RegistrasiStatus) {
  const map: Record<RegistrasiStatus, string> = {
    BELUM: "Belum",
    MENUNGGU: "Proses",
    LUNAS: "Selesai",
    DISPENSASI: "DISPENSASI",
  };
  return map[status];
}

export async function syncRegistrasiFromPaidTagihan(
  tagihanId: string,
  options: { verifiedBy?: string | null; verifiedAt?: string | null } = {},
) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Database error");

  const tagihanResult = await getTagihanForRegistrasiSync(supabase, tagihanId);
  const bill = tagihanResult.bill;
  if (tagihanResult.skipped || !bill) {
    return { success: true, skipped: true, reason: tagihanResult.reason, tagihanId };
  }

  if (bill.status !== "Lunas") {
    return { success: true, skipped: true, reason: "TAGIHAN_NOT_LUNAS", tagihanId };
  }

  const verifiedAt = options.verifiedAt ?? new Date().toISOString();
  return syncRegistrasiByTagihanStatus(supabase, tagihanId, "LUNAS", {
    verifiedBy: options.verifiedBy ?? null,
    verifiedAt,
  });
}

export async function syncRegistrasiFromPendingTagihan(tagihanId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Database error");

  const tagihanResult = await getTagihanForRegistrasiSync(supabase, tagihanId);
  const bill = tagihanResult.bill;
  if (tagihanResult.skipped || !bill) {
    return { success: true, skipped: true, reason: tagihanResult.reason, tagihanId };
  }

  if (bill.status === "Lunas") {
    return syncRegistrasiFromPaidTagihan(tagihanId);
  }

  const { data: payments } = await supabase
    .from("pembayaran")
    .select("status, nominal")
    .eq("tagihan_id", tagihanId)
    .eq("status", "Terverifikasi");

  const totalPaid = (payments || []).reduce((acc, p) => acc + Number(p.nominal), 0);

  if (totalPaid > 0) {
    // If there's any verified payment (e.g. installment), grant "LUNAS" status for KRS
    return syncRegistrasiFromPaidTagihan(tagihanId);
  }

  const current = await getExistingRegistrasiForBill(supabase, bill);
  if (isFinalRegistrasiStatus(current?.status)) {
    return {
      success: true,
      skipped: true,
      reason: "REGISTRASI_FINAL",
      registrasiId: current?.id ?? null,
      tagihanId,
    };
  }

  const payload = {
    status: "MENUNGGU" as const,
    tagihan_id: bill.id,
    verified_by: null,
    verified_at: null,
    updated_at: new Date().toISOString(),
  };

  const writeQuery = current
    ? supabase
        .from("registrasi_semester")
        .update(payload)
        .eq("id", current.id)
        .select("id")
        .single()
    : supabase
        .from("registrasi_semester")
        .insert({
          mahasiswa_id: bill.mahasiswa_id,
          tahun_akademik_id: bill.tahun_akademik_id,
          ...payload,
        })
        .select("id")
        .single();

  const { data: registrasi, error: writeError } = await writeQuery;
  if (writeError) {
    logRegistrasiError("sync pending registrasi", writeError);
    throw new Error("Gagal menyinkronkan status menunggu daftar ulang.");
  }

  return {
    success: true,
    skipped: false,
    registrasiId: registrasi?.id ?? current?.id ?? null,
    tagihanId,
    mahasiswaId: bill.mahasiswa_id,
    tahunAkademikId: bill.tahun_akademik_id,
  };
}

export async function syncRegistrasiFromRejectedPayment(tagihanId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Database error");

  const tagihanResult = await getTagihanForRegistrasiSync(supabase, tagihanId);
  const bill = tagihanResult.bill;
  if (tagihanResult.skipped || !bill) {
    return { success: true, skipped: true, reason: tagihanResult.reason, tagihanId };
  }

  const current = await getExistingRegistrasiForBill(supabase, bill);
  if (!current || isFinalRegistrasiStatus(current.status)) {
    return {
      success: true,
      skipped: true,
      reason: current ? "REGISTRASI_FINAL" : "REGISTRASI_NOT_FOUND",
      tagihanId,
    };
  }

  const { data: validPayments, error: paymentError } = await supabase
    .from("pembayaran")
    .select("id, status")
    .eq("tagihan_id", tagihanId)
    .in("status", ["Menunggu", "Terverifikasi"]);

  if (paymentError) {
    logRegistrasiError("sync rejected valid payment query", paymentError);
    throw new Error("Gagal membaca pembayaran aktif daftar ulang.");
  }

  if ((validPayments ?? []).some((payment) => payment.status === "Terverifikasi")) {
    if (bill.status === "Lunas") {
      return syncRegistrasiFromPaidTagihan(tagihanId);
    }

    return syncRegistrasiFromPendingTagihan(tagihanId);
  }

  if ((validPayments ?? []).length > 0) {
    return syncRegistrasiFromPendingTagihan(tagihanId);
  }

  const { error: updateError } = await supabase
    .from("registrasi_semester")
    .update({
      status: "BELUM",
      verified_by: null,
      verified_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id);

  if (updateError) {
    logRegistrasiError("sync rejected registrasi update", updateError);
    throw new Error("Gagal mengembalikan status daftar ulang.");
  }

  return {
    success: true,
    skipped: false,
    registrasiId: current.id,
    tagihanId,
    mahasiswaId: bill.mahasiswa_id,
    tahunAkademikId: bill.tahun_akademik_id,
  };
}

async function fetchRegistrasiBase(
  supabase: SupabaseClient,
  params: Pick<ListRegistrasiParams, "tahunAkademikId" | "mahasiswaId" | "status">,
  legacySchema = false
) {
  if (legacySchema) {
    let legacyQuery = supabase
      .from("registrasi_semester")
      .select("id, id_mahasiswa, id_tahun_akademik, status, tanggal, created_at")
      .order("created_at", { ascending: false });

    if (params.tahunAkademikId) {
      legacyQuery = legacyQuery.eq("id_tahun_akademik", params.tahunAkademikId);
    }

    if (params.mahasiswaId) {
      legacyQuery = legacyQuery.eq("id_mahasiswa", params.mahasiswaId);
    }

    if (params.status) {
      legacyQuery = legacyQuery.eq("status", legacyStatus(params.status));
    }

    const result = await legacyQuery;
    if (result.error) return result;

    return {
      data: ((result.data ?? []) as LegacyRegistrasiRow[]).map((item) => ({
        id: item.id,
        mahasiswa_id: item.id_mahasiswa,
        tahun_akademik_id: item.id_tahun_akademik,
        status: normalizeStatus(item.status),
        tagihan_id: null,
        catatan: null,
        verified_by: null,
        verified_at: null,
        created_at: item.created_at,
        updated_at: item.tanggal ?? item.created_at,
      })),
      error: null,
    };
  }

  let query = supabase
    .from("registrasi_semester")
    .select(`
      id,
      mahasiswa_id,
      tahun_akademik_id,
      status,
      tagihan_id,
      catatan,
      verified_by,
      verified_at,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: false });

  if (params.tahunAkademikId) {
    query = query.eq("tahun_akademik_id", params.tahunAkademikId);
  }

  if (params.mahasiswaId) {
    query = query.eq("mahasiswa_id", params.mahasiswaId);
  }

  if (params.status) {
    query = query.eq("status", params.status);
  }

  return query;
}

export async function listRegistrasi(params: ListRegistrasiParams = {}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Database error");

  let effectiveParams = params;

  if (params.userId && !params.mahasiswaId) {
    const { data: mahasiswa, error: mahasiswaError } = await supabase
      .from("mahasiswa")
      .select("id")
      .eq("user_id", params.userId)
      .maybeSingle();

    if (mahasiswaError) {
      logRegistrasiError("resolve mahasiswa by user", mahasiswaError);
      throwRegistrasiLoadError();
    }

    if (!mahasiswa?.id) return [];

    effectiveParams = { ...params, mahasiswaId: mahasiswa.id };
  }

  let { data, error } = await fetchRegistrasiBase(supabase, effectiveParams);
  if (error?.code === "42703") {
    ({ data, error } = await fetchRegistrasiBase(supabase, effectiveParams, true));
  }
  if (error) {
    logRegistrasiError("list base query", error);
    throwRegistrasiLoadError();
  }

  const items = (data ?? []) as RegistrasiBaseRow[];

  const mahasiswaIds = [...new Set(items.map((item) => item.mahasiswa_id).filter(Boolean))];
  const tahunAkademikIds = [...new Set(items.map((item) => item.tahun_akademik_id).filter(Boolean))];
  const tagihanIds = [...new Set(items.map((item) => item.tagihan_id).filter(Boolean))];
  const verifierIds = [...new Set(items.map((item) => item.verified_by).filter(Boolean))];

  const [mahasiswaResult, tahunAkademikResult, tagihanResult, verifierResult] = await Promise.all([
    mahasiswaIds.length
      ? supabase
          .from("mahasiswa")
          .select(`
            id,
            nim,
            status_mahasiswa,
            prodi_id,
            users!mahasiswa_user_id_fkey(full_name),
            program_studi!mahasiswa_prodi_id_fkey(nama)
          `)
          .in("id", mahasiswaIds)
      : Promise.resolve({ data: [], error: null }),
    tahunAkademikIds.length
      ? supabase.from("tahun_akademik").select("id, kode, nama, semester").in("id", tahunAkademikIds)
      : Promise.resolve({ data: [], error: null }),
    tagihanIds.length
      ? supabase.from("tagihan").select("id, nominal, status").in("id", tagihanIds)
      : Promise.resolve({ data: [], error: null }),
    verifierIds.length
      ? supabase.from("users").select("id, full_name").in("id", verifierIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (mahasiswaResult.error) {
    logRegistrasiError("mahasiswa relation query", mahasiswaResult.error);
    throwRegistrasiLoadError();
  }
  if (tahunAkademikResult.error) {
    logRegistrasiError("tahun akademik relation query", tahunAkademikResult.error);
    throwRegistrasiLoadError();
  }
  if (tagihanResult.error) {
    logRegistrasiError("tagihan relation query", tagihanResult.error);
    throwRegistrasiLoadError();
  }
  if (verifierResult.error) {
    logRegistrasiError("verifier relation query", verifierResult.error);
    throwRegistrasiLoadError();
  }

  const mahasiswaById = new Map(
    ((mahasiswaResult.data ?? []) as MahasiswaRelationRow[]).map((item) => [
      item.id,
      {
        nim: item.nim,
        status_mahasiswa: item.status_mahasiswa,
        prodi_id: item.prodi_id,
        users: firstRelation(item.users),
        program_studi: firstRelation(item.program_studi),
      },
    ])
  );
  const tahunAkademikById = new Map((tahunAkademikResult.data ?? []).map((item) => [item.id, item]));
  const tagihanById = new Map((tagihanResult.data ?? []).map((item) => [item.id, item]));
  const verifierById = new Map((verifierResult.data ?? []).map((item) => [item.id, item]));

  let registrasiItems = items.map((item) => ({
    ...item,
    mahasiswa: mahasiswaById.get(item.mahasiswa_id) ?? null,
    tahun_akademik: tahunAkademikById.get(item.tahun_akademik_id) ?? null,
    tagihan: item.tagihan_id ? tagihanById.get(item.tagihan_id) ?? null : null,
    verifier: item.verified_by ? verifierById.get(item.verified_by) ?? null : null,
  }));

  if (effectiveParams.prodiId) {
    registrasiItems = registrasiItems.filter(item => item.mahasiswa?.prodi_id === effectiveParams.prodiId);
  }

  if (effectiveParams.query) {
    const q = effectiveParams.query.toLowerCase();
    registrasiItems = registrasiItems.filter(item =>
      item.mahasiswa?.users?.full_name?.toLowerCase().includes(q) ||
      item.mahasiswa?.nim?.toLowerCase().includes(q)
    );
  }

  return registrasiItems as RegistrasiRow[];
}
