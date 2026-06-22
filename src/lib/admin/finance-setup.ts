import "server-only";

import { createAdminClient } from "@/supabase/admin";

export type FinanceSetupKind =
  | "coa"
  | "bank-account"
  | "bank-integration"
  | "payment-method"
  | "scholarship"
  | "category";

const tableByKind: Record<FinanceSetupKind, string> = {
  coa: "chart_of_accounts",
  "bank-account": "campus_bank_accounts",
  "bank-integration": "payment_bank_integrations",
  "payment-method": "payment_methods",
  scholarship: "beasiswa_diskon",
  category: "kategori_keuangan",
};

export async function getFinanceSetupData() {
  const supabase = createAdminClient();
  if (!supabase) {
    return {
      coa: [],
      bankAccounts: [],
      bankIntegrations: [],
      paymentMethods: [],
      scholarships: [],
      categories: [],
    };
  }

  const [coa, bankAccounts, bankIntegrations, paymentMethods, scholarships, categories] = await Promise.all([
    supabase
      .from("chart_of_accounts")
      .select("*, parent:parent_id(kode, nama)")
      .is("deleted_at", null)
      .order("kode", { ascending: true }),
    supabase
      .from("campus_bank_accounts")
      .select("*, coa:coa_id(kode, nama)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("payment_bank_integrations")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("payment_methods")
      .select("*, bank_account:bank_account_id(bank_name, account_number), integration:integration_id(provider, bank_code)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("beasiswa_diskon")
      .select("*, tahun_akademik:tahun_akademik_id(nama), program_studi:prodi_id(nama)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("kategori_keuangan")
      .select("*, coa:coa_id(kode, nama)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  return {
    coa: coa.data ?? [],
    bankAccounts: bankAccounts.data ?? [],
    bankIntegrations: bankIntegrations.data ?? [],
    paymentMethods: paymentMethods.data ?? [],
    scholarships: scholarships.data ?? [],
    categories: categories.data ?? [],
  };
}

export async function saveFinanceSetupRecord(
  kind: FinanceSetupKind,
  payload: Record<string, unknown>,
  userId: string,
  id?: string | null,
) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const tableName = tableByKind[kind];
  const sanitizedPayload = {
    ...payload,
    updated_by: userId,
  };

  if (id) {
    const { error } = await supabase
      .from(tableName)
      .update(sanitizedPayload)
      .eq("id", id)
      .is("deleted_at", null);

    if (error) throw error;
    return { id };
  }

  const insertPayload = kind === "category"
    ? sanitizedPayload
    : {
        ...sanitizedPayload,
        created_by: userId,
      };

  const { data, error } = await supabase
    .from(tableName)
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) throw error;
  return { id: data.id as string };
}

export async function softDeleteFinanceSetupRecord(kind: FinanceSetupKind, id: string, userId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const tableName = tableByKind[kind];
  const { error } = await supabase
    .from(tableName)
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      updated_by: userId,
      is_active: false,
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw error;
}

export async function setActiveAcademicYear(id: string, _userId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase admin client not available");

  const { error: resetError } = await supabase
    .from("tahun_akademik")
    .update({ is_aktif: false })
    .neq("id", id);

  if (resetError) throw resetError;

  const { error } = await supabase
    .from("tahun_akademik")
    .update({ is_aktif: true })
    .eq("id", id);

  if (error) throw error;
}
