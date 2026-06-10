import "server-only";

import { createAdminClient } from "@/supabase/admin";

export type GedungRow = {
  id: string;
  kode: string;
  nama: string;
  jumlah_lantai: number;
  keterangan: string | null;
  is_active: boolean;
};

export async function listGedung() {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("gedung")
    .select("*")
    .is("deleted_at", null)
    .order("nama", { ascending: true });

  if (error) {
    console.error("Error listing gedung:", error);
    return [];
  }

  return data || [];
}

export async function upsertGedung(values: any) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  const payload = {
    kode: values.kode,
    nama: values.nama,
    jumlah_lantai: values.jumlahLantai,
    is_active: values.isAktif,
  };

  let result;
  if (values.id) {
    result = await supabase.from("gedung").update(payload).eq("id", values.id);
  } else {
    result = await supabase.from("gedung").insert(payload);
  }

  if (result.error) {
    console.error("Supabase error in upsertGedung:", result.error);
    throw new Error(result.error.message);
  }
}

export async function deleteGedung(id: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");
  
  const { error } = await supabase.from("gedung").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  
  if (error) throw new Error(error.message);
}
