import "server-only";

import { createAdminClient } from "@/supabase/admin";

export async function getDashboardPimpinanStats(tahunAkademikId?: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Client error");

  // If no year passed, use active year
  let effectiveYearId = tahunAkademikId;
  if (!effectiveYearId) {
    const { data: activeYear } = await supabase
      .from("tahun_akademik")
      .select("id")
      .eq("is_aktif", true)
      .maybeSingle();
    effectiveYearId = activeYear?.id;
  }

  // Aggregate active students
  const { count: mahasiswaAktifCount } = await supabase
    .from("mahasiswa")
    .select("id", { count: "exact", head: true })
    .eq("status_mahasiswa", "AKTIF")
    .is("deleted_at", null);

  // Aggregate active lecturers
  const { count: dosenAktifCount } = await supabase
    .from("dosen")
    .select("id", { count: "exact", head: true })
    .eq("status_dosen", "Aktif")
    .is("deleted_at", null);

  // PMB Summary
  const { data: pmbData } = await supabase
    .from("pmb_pendaftaran")
    .select("status_seleksi");

  let pmbTotal = 0;
  let pmbLulus = 0;
  let pmbDitolak = 0;
  let pmbProses = 0;

  if (pmbData) {
    pmbTotal = pmbData.length;
    pmbLulus = pmbData.filter(d => d.status_seleksi === "LULUS").length;
    pmbDitolak = pmbData.filter(d => d.status_seleksi === "DITOLAK").length;
    pmbProses = pmbData.filter(d => !["LULUS", "DITOLAK"].includes(d.status_seleksi)).length;
  }

  // Finance Summary (based on tagihan + pembayaran for the active year, or overall if no year)
  let tagihanQuery = supabase.from("tagihan").select("nominal, status").is("deleted_at", null);
  if (effectiveYearId) {
    tagihanQuery = tagihanQuery.eq("tahun_akademik_id", effectiveYearId);
  }

  const { data: tagihanData } = await tagihanQuery;

  let totalTagihan = 0;
  let tagihanLunas = 0; // count of lunas bills

  if (tagihanData) {
    totalTagihan = tagihanData.reduce((acc, curr) => acc + Number(curr.nominal || 0), 0);
    tagihanLunas = tagihanData.filter(t => t.status === "Lunas").length;
  }

  let pembayaranQuery: any = supabase
    .from("pembayaran")
    .select("nominal, tagihan!inner(id)")
    .eq("status", "Terverifikasi")
    .is("tagihan.deleted_at", null);
  // Filter by tagihan's year if needed via inner join
  if (effectiveYearId) {
    pembayaranQuery = supabase
      .from("pembayaran")
      .select("nominal, tagihan!inner(tahun_akademik_id)")
      .eq("status", "Terverifikasi")
      .is("tagihan.deleted_at", null)
      .eq("tagihan.tahun_akademik_id", effectiveYearId);
  }

  const { data: pembayaranData } = await pembayaranQuery;
  const totalPembayaranMasuk = ((pembayaranData as Array<any>) || []).reduce((acc: number, curr: any) => acc + Number(curr.nominal || 0), 0);

  const totalTunggakan = Math.max(0, totalTagihan - totalPembayaranMasuk);

  return {
    mahasiswaAktif: mahasiswaAktifCount || 0,
    dosenAktif: dosenAktifCount || 0,
    pmb: {
      total: pmbTotal,
      lulus: pmbLulus,
      ditolak: pmbDitolak,
      proses: pmbProses
    },
    keuangan: {
      totalTagihan,
      totalPembayaranMasuk,
      totalTunggakan,
      tagihanLunas
    }
  };
}

export async function getLaporanAkademik(filters: { tahunAkademikId?: string, prodiId?: string } = {}) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase.from("mahasiswa").select(`
    nim,
    angkatan,
    status_mahasiswa,
    ips,
    ipk,
    users!mahasiswa_user_id_fkey(full_name),
    program_studi!mahasiswa_prodi_id_fkey(nama)
  `).is("deleted_at", null);

  if (filters.prodiId && filters.prodiId !== "all") {
    query = query.eq("prodi_id", filters.prodiId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching laporan akademik:", error);
    return [];
  }

  return (data || []).map((m: any) => ({
    nim: m.nim || "-",
    nama: m.users?.full_name || "-",
    prodi: m.program_studi?.nama || "-",
    angkatan: m.angkatan || "-",
    status: m.status_mahasiswa,
    ips: m.ips || 0,
    ipk: m.ipk || 0
  }));
}

export async function getLaporanPmb(filters: { tahunAkademikId?: string, prodiId?: string, statusSeleksi?: string, statusPembayaran?: string } = {}) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase.from("pmb_pendaftaran").select(`
    nomor_pendaftaran,
    nama_lengkap,
    status_seleksi,
    status_pembayaran,
    created_at,
    program_studi!pmb_pendaftaran_prodi_pilihan_id_fkey(nama)
  `);

  if (filters.prodiId && filters.prodiId !== "all") {
    query = query.eq("prodi_pilihan_id", filters.prodiId);
  }
  if (filters.statusSeleksi && filters.statusSeleksi !== "all") {
    query = query.eq("status_seleksi", filters.statusSeleksi);
  }
  if (filters.statusPembayaran && filters.statusPembayaran !== "all") {
    query = query.eq("status_pembayaran", filters.statusPembayaran);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching laporan PMB:", error);
    return [];
  }

  return (data || []).map((p: any) => ({
    nomor: p.nomor_pendaftaran,
    nama: p.nama_lengkap,
    prodi: p.program_studi?.nama || "-",
    statusSeleksi: p.status_seleksi,
    statusPembayaran: p.status_pembayaran,
    tanggalDaftar: new Date(p.created_at).toLocaleDateString('id-ID')
  }));
}

export async function getLaporanKeuangan(filters: { tahunAkademikId?: string, jenis?: string, status?: string } = {}) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase.from("tagihan").select(`
    id,
    jenis,
    nominal,
    status,
    jatuh_tempo,
    mahasiswa!tagihan_mahasiswa_id_fkey(
      nim,
      users!mahasiswa_user_id_fkey(full_name),
      program_studi!mahasiswa_prodi_id_fkey(nama)
    )
  `).is("deleted_at", null);

  if (filters.tahunAkademikId && filters.tahunAkademikId !== "all") {
    query = query.eq("tahun_akademik_id", filters.tahunAkademikId);
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.jenis && filters.jenis !== "all") {
    query = query.eq("jenis", filters.jenis);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching laporan keuangan:", error);
    return [];
  }

  // Also fetch payments for these bills to show total paid vs remaining
  const billIds = (data || []).map(b => b.id);
  const paymentsQuery = billIds.length > 0
    ? supabase.from("pembayaran").select("tagihan_id, nominal").eq("status", "Terverifikasi").in("tagihan_id", billIds)
    : { data: [] };

  const { data: paymentsData } = await paymentsQuery;
  const paidByBill = new Map<string, number>();
  (paymentsData || []).forEach(p => {
    paidByBill.set(p.tagihan_id, (paidByBill.get(p.tagihan_id) || 0) + Number(p.nominal));
  });

  return (data || []).map((t: any) => {
    const totalPaid = paidByBill.get(t.id) || 0;
    const nominal = Number(t.nominal);
    return {
      id: t.id,
      jenis: t.jenis,
      nominal: nominal,
      terbayar: totalPaid,
      tunggakan: Math.max(0, nominal - totalPaid),
      status: t.status,
      jatuhTempo: t.jatuh_tempo,
      mahasiswaNama: t.mahasiswa?.users?.full_name || "-",
      mahasiswaNim: t.mahasiswa?.nim || "-",
      prodi: t.mahasiswa?.program_studi?.nama || "-"
    };
  });
}
