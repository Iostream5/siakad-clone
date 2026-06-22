import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const DEV_PROJECT_REF = "akcslbvwkpbilsywrtkk";
const DEV_URL_FRAGMENT = `${DEV_PROJECT_REF}.supabase.co`;
const statusProject = process.env.STATUS_PROJECT?.trim().toUpperCase();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (statusProject !== "DEV") {
  throw new Error("Seed dibatalkan: STATUS_PROJECT harus DEV.");
}

if (!supabaseUrl?.includes(DEV_URL_FRAGMENT)) {
  throw new Error(`Seed dibatalkan: NEXT_PUBLIC_SUPABASE_URL harus mengarah ke ${DEV_URL_FRAGMENT}.`);
}

if (!serviceRoleKey) {
  throw new Error("Seed dibatalkan: SUPABASE_SERVICE_ROLE_KEY belum tersedia di .env.local.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const credentials = {
  keuangan: { email: "keuangan@kampus.ac.id", password: "keu12345", role: "Keuangan", username: "keuangan", fullName: "Biro Keuangan" },
  mahasiswa: { email: "mahasiswa@kampus.ac.id", password: "mhs12345", role: "Mahasiswa", username: "mahasiswa", fullName: "Nadia Putri" },
  calon: { email: "calon.pmb@kampus.ac.id", password: "PmbDev12345", role: "Calon Mahasiswa", username: "calonpmb", fullName: "Calon Mahasiswa Sample" },
};

function throwIfError(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data;
}

async function listAllAuthUsers() {
  const users = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...(data.users ?? []));
    if ((data.users ?? []).length < perPage) break;
    page += 1;
  }

  return users;
}

async function findAuthUserByEmail(email) {
  const users = await listAllAuthUsers();
  return users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function ensureAuthUser({ email, password, role, username, fullName }) {
  const existingAuthUser = await findAuthUserByEmail(email);
  let userId = existingAuthUser?.id;

  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });
    if (error) throw error;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });
    if (error) throw error;
    userId = data.user.id;
  }

  throwIfError(
    await supabase.from("users").upsert({
      id: userId,
      username,
      email,
      full_name: fullName,
      role,
      is_active: true,
      deleted_at: null,
    }, { onConflict: "id" }),
    `Upsert public.users ${email}`,
  );

  throwIfError(
    await supabase.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" }),
    `Upsert role ${email}`,
  );

  return userId;
}

async function ensureSingleByUpsert(table, payload, onConflict, label) {
  const data = throwIfError(
    await supabase.from(table).upsert(payload, { onConflict }).select("id").single(),
    label,
  );
  return data.id;
}

async function ensureActiveAcademicYear() {
  const existing = throwIfError(
    await supabase
      .from("tahun_akademik")
      .select("id")
      .eq("is_aktif", true)
      .order("tanggal_mulai", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "Ambil tahun akademik aktif",
  );

  if (existing?.id) return existing.id;

  return ensureSingleByUpsert(
    "tahun_akademik",
    {
      kode: "2026-GENAP",
      nama: "2025/2026 Genap",
      semester: "Genap",
      tanggal_mulai: "2026-02-01",
      tanggal_selesai: "2026-07-31",
      is_aktif: true,
      is_krs_open: false,
    },
    "kode",
    "Buat tahun akademik aktif",
  );
}

async function ensureFacultyAndProgram() {
  const facultyId = await ensureSingleByUpsert(
    "fakultas",
    {
      kode: "FAI",
      nama: "Fakultas Agama Islam",
      dekan: "Dr. Ahmad Fauzi",
      deskripsi: "Seed DEV untuk flow PMB dan keuangan.",
      is_active: true,
    },
    "kode",
    "Buat fakultas DEV",
  );

  const programId = await ensureSingleByUpsert(
    "program_studi",
    {
      kode: "MPI",
      nama: "Manajemen Pendidikan Islam",
      jenjang: "S1",
      fakultas_id: facultyId,
      is_active: true,
      deleted_at: null,
    },
    "kode",
    "Buat prodi DEV",
  );

  return { facultyId, programId };
}

async function ensureMahasiswa(userId, programId) {
  const data = throwIfError(
    await supabase
      .from("mahasiswa")
      .upsert({
        user_id: userId,
        nim: "20260001",
        nama_ibu_kandung: "Ibu Sample",
        tempat_lahir: "Jakarta",
        tanggal_lahir: "2005-01-01",
        angkatan: 2026,
        prodi_id: programId,
        status_mahasiswa: "AKTIF",
        saldo_tunggakan: 0,
        deleted_at: null,
      }, { onConflict: "user_id" })
      .select("id")
      .single(),
    "Buat mahasiswa DEV",
  );

  return data.id;
}

async function ensurePmbFlow({ tahunAkademikId, programId, calonUserId, keuanganUserId }) {
  const pmbFeeLookup = throwIfError(
    await supabase
      .from("pmb_biaya")
      .select("id")
      .eq("tahun_akademik_id", tahunAkademikId)
      .eq("prodi_id", programId)
      .eq("jalur_pendaftaran", "Reguler")
      .eq("jenis_pendaftaran", "Baru")
      .limit(1)
      .maybeSingle(),
    "Cari tarif PMB",
  );

  const pmbFeeId = pmbFeeLookup?.id ?? throwIfError(
    await supabase
      .from("pmb_biaya")
      .insert({
        tahun_akademik_id: tahunAkademikId,
        prodi_id: programId,
        nama: "Biaya Pendaftaran PMB DEV",
        jalur_pendaftaran: "Reguler",
        jenis_pendaftaran: "Baru",
        gelombang: "Gelombang 1",
        nominal: 250000,
        tanggal_mulai: "2026-01-01",
        tanggal_selesai: "2026-12-31",
        due_days: 7,
        is_active: true,
        catatan: "Seed DEV finance.",
      })
      .select("id")
      .single(),
    "Buat tarif PMB",
  ).id;

  const registrationId = await ensureSingleByUpsert(
    "pmb_pendaftaran",
    {
      nomor_pendaftaran: "PMB-DEV-2026-0001",
      nama_lengkap: credentials.calon.fullName,
      email: credentials.calon.email,
      no_hp: "081234567890",
      user_id: calonUserId,
      login_email: credentials.calon.email,
      login_created_at: new Date().toISOString(),
      prodi_pilihan_id: programId,
      jalur_pendaftaran: "Reguler",
      jenis_pendaftaran: "Baru",
      tempat_lahir: "Jakarta",
      tanggal_lahir: "2005-01-01",
      jenis_kelamin: "Laki-laki",
      alamat: "Jl. Sample DEV No. 1",
      kota_asal: "Jakarta",
      pendidikan_terakhir: "SMA/MA",
      asal_sekolah: "SMA Sample DEV",
      jurusan_sekolah: "IPA",
      tahun_lulus: 2024,
      nama_ayah: "Ayah Sample",
      pekerjaan_ayah: "Pegawai",
      nama_ibu: "Ibu Sample",
      pekerjaan_ibu: "Wiraswasta",
      no_hp_orang_tua: "081234567891",
      pmb_biaya_id: pmbFeeId,
      invoice_number: "INV-PMB-DEV-2026-0001",
      invoice_amount: 250000,
      invoice_due_at: "2026-07-01T00:00:00.000Z",
      status_pendaftaran: "Verified",
      status_pembayaran: "paid",
      status_seleksi: "VERIFIKASI",
      verified_at: new Date().toISOString(),
    },
    "nomor_pendaftaran",
    "Buat pendaftaran PMB DEV",
  );

  const existingPayment = throwIfError(
    await supabase
      .from("pmb_pembayaran")
      .select("id")
      .eq("pmb_pendaftaran_id", registrationId)
      .eq("metode", "Transfer Bank")
      .limit(1)
      .maybeSingle(),
    "Cari pembayaran PMB",
  );

  const payload = {
    pmb_pendaftaran_id: registrationId,
    nominal: 250000,
    metode: "Transfer Bank",
    bank_pengirim: "BCA",
    nama_pengirim: credentials.calon.fullName,
    status: "Terverifikasi",
    catatan: "Seed DEV pembayaran PMB.",
    verified_by: keuanganUserId,
    verified_at: new Date().toISOString(),
  };

  if (existingPayment?.id) {
    throwIfError(await supabase.from("pmb_pembayaran").update(payload).eq("id", existingPayment.id), "Update pembayaran PMB");
    return registrationId;
  }

  throwIfError(await supabase.from("pmb_pembayaran").insert(payload), "Buat pembayaran PMB");
  return registrationId;
}

async function ensureMasterBiaya({ tahunAkademikId, programId }) {
  const category = throwIfError(
    await supabase
      .from("kategori_keuangan")
      .select("id")
      .eq("nama", "SPP / UKT Mahasiswa")
      .limit(1)
      .maybeSingle(),
    "Cari kategori SPP",
  );

  const existing = throwIfError(
    await supabase
      .from("master_biaya")
      .select("id")
      .eq("nama", "SPP Semester Genap DEV")
      .eq("tahun_akademik_id", tahunAkademikId)
      .eq("prodi_id", programId)
      .limit(1)
      .maybeSingle(),
    "Cari master biaya",
  );

  const payload = {
    nama: "SPP Semester Genap DEV",
    kategori_id: category?.id ?? null,
    tahun_akademik_id: tahunAkademikId,
    prodi_id: programId,
    angkatan: 2026,
    nominal: 3000000,
    is_active: true,
    tingkat_kelas: ["1"],
    jurusan: [],
    jenis_kelamin: "Semua",
    gelombang: "Semua",
    jalur: "Reguler",
    terbit: "Sekali",
    boleh_angsur: false,
    is_mutasi: false,
    is_boarding: false,
    keterangan: "Seed DEV finance.",
    status: true,
  };

  if (existing?.id) {
    throwIfError(await supabase.from("master_biaya").update(payload).eq("id", existing.id), "Update master biaya");
    return existing.id;
  }

  const data = throwIfError(await supabase.from("master_biaya").insert(payload).select("id").single(), "Buat master biaya");
  return data.id;
}

async function ensureTagihan({ mahasiswaId, tahunAkademikId, masterBiayaId, jenis, nominal, status }) {
  const existing = throwIfError(
    await supabase
      .from("tagihan")
      .select("id")
      .eq("mahasiswa_id", mahasiswaId)
      .eq("tahun_akademik_id", tahunAkademikId)
      .eq("jenis", jenis)
      .limit(1)
      .maybeSingle(),
    `Cari tagihan ${jenis}`,
  );

  const payload = {
    mahasiswa_id: mahasiswaId,
    tahun_akademik_id: tahunAkademikId,
    master_biaya_id: masterBiayaId,
    jenis,
    nominal,
    jatuh_tempo: "2026-07-15",
    status,
  };

  if (existing?.id) {
    throwIfError(await supabase.from("tagihan").update(payload).eq("id", existing.id), `Update tagihan ${jenis}`);
    return existing.id;
  }

  const data = throwIfError(await supabase.from("tagihan").insert(payload).select("id").single(), `Buat tagihan ${jenis}`);
  return data.id;
}

async function ensurePembayaran({ tagihanId, keuanganUserId }) {
  const existing = throwIfError(
    await supabase
      .from("pembayaran")
      .select("id")
      .eq("tagihan_id", tagihanId)
      .eq("metode", "Transfer Bank")
      .limit(1)
      .maybeSingle(),
    "Cari pembayaran mahasiswa",
  );

  const payload = {
    tagihan_id: tagihanId,
    nominal: 3000000,
    metode: "Transfer Bank",
    bukti_url: null,
    verified_by: keuanganUserId,
    verified_at: new Date().toISOString(),
    status: "Terverifikasi",
  };

  if (existing?.id) {
    throwIfError(await supabase.from("pembayaran").update(payload).eq("id", existing.id), "Update pembayaran mahasiswa");
    return existing.id;
  }

  const data = throwIfError(await supabase.from("pembayaran").insert(payload).select("id").single(), "Buat pembayaran mahasiswa");
  return data.id;
}

async function ensureCashFlow({ pembayaranId, keuanganUserId }) {
  const category = throwIfError(
    await supabase
      .from("kategori_keuangan")
      .select("id")
      .eq("nama", "SPP / UKT Mahasiswa")
      .limit(1)
      .maybeSingle(),
    "Cari kategori arus kas",
  );

  const existing = throwIfError(
    await supabase
      .from("arus_kas")
      .select("id")
      .eq("referensi_id", pembayaranId)
      .limit(1)
      .maybeSingle(),
    "Cari arus kas",
  );

  const payload = {
    tanggal: "2026-06-19",
    kategori_id: category?.id ?? null,
    tipe: "Masuk",
    judul: "Pembayaran SPP Semester Genap DEV",
    deskripsi: "Seed DEV pembayaran mahasiswa.",
    nominal: 3000000,
    referensi_id: pembayaranId,
    created_by: keuanganUserId,
  };

  if (existing?.id) {
    throwIfError(await supabase.from("arus_kas").update(payload).eq("id", existing.id), "Update arus kas");
    return existing.id;
  }

  const data = throwIfError(await supabase.from("arus_kas").insert(payload).select("id").single(), "Buat arus kas");
  return data.id;
}

async function ensureByMatch(table, match, payload, label) {
  let query = supabase.from(table).select("id");
  for (const [key, value] of Object.entries(match)) {
    query = value === null ? query.is(key, null) : query.eq(key, value);
  }

  const existing = throwIfError(await query.limit(1).maybeSingle(), `Cari ${label}`);
  if (existing?.id) {
    throwIfError(await supabase.from(table).update(payload).eq("id", existing.id), `Update ${label}`);
    return existing.id;
  }

  const data = throwIfError(await supabase.from(table).insert(payload).select("id").single(), `Buat ${label}`);
  return data.id;
}

async function ensureFinanceSetupSeed({ tahunAkademikId, programId, keuanganUserId, mahasiswaUserId, tagihanId }) {
  const kasCoaId = await ensureSingleByUpsert(
    "chart_of_accounts",
    {
      kode: "1101",
      nama: "Kas dan Bank Kampus",
      tipe: "Aset",
      deskripsi: "Akun kas dan rekening operasional kampus DEV.",
      is_active: true,
      updated_by: keuanganUserId,
    },
    "kode",
    "Upsert COA kas",
  );

  const pendapatanCoaId = await ensureSingleByUpsert(
    "chart_of_accounts",
    {
      kode: "4101",
      nama: "Pendapatan Pendidikan",
      tipe: "Pendapatan",
      deskripsi: "Pendapatan SPP, PMB, dan biaya akademik DEV.",
      is_active: true,
      updated_by: keuanganUserId,
    },
    "kode",
    "Upsert COA pendapatan",
  );

  await ensureByMatch(
    "kategori_keuangan",
    { nama: "SPP / UKT Mahasiswa", tipe: "Pemasukan" },
    {
      nama: "SPP / UKT Mahasiswa",
      tipe: "Pemasukan",
      deskripsi: "Penerimaan SPP dan UKT mahasiswa.",
      is_active: true,
      coa_id: pendapatanCoaId,
      updated_by: keuanganUserId,
    },
    "kategori SPP",
  );

  const bankAccountId = await ensureByMatch(
    "campus_bank_accounts",
    { bank_name: "Bank Syariah Indonesia", account_number: "1234567890" },
    {
      bank_name: "Bank Syariah Indonesia",
      account_number: "1234567890",
      account_name: "STAI Al-Ittihad DEV",
      branch: "Cianjur",
      coa_id: kasCoaId,
      is_default: true,
      is_active: true,
      catatan: "Rekening contoh DEV, bukan rekening produksi.",
      updated_by: keuanganUserId,
    },
    "rekening kampus",
  );

  const integrationId = await ensureByMatch(
    "payment_bank_integrations",
    { provider: "dummy-va", bank_code: "BSI", mode: "sandbox" },
    {
      provider: "dummy-va",
      bank_code: "BSI",
      bank_name: "Bank Syariah Indonesia",
      mode: "sandbox",
      public_config: { merchant_id: "DEV-MERCHANT", callback_path: "/api/webhooks/dummy-va" },
      secret_setting_keys: ["payment.dummy_va.secret_key"],
      is_active: true,
      catatan: "Integrasi dummy DEV tanpa menyimpan secret mentah.",
      updated_by: keuanganUserId,
    },
    "integrasi bank dummy",
  );

  await ensureSingleByUpsert(
    "payment_methods",
    {
      kode: "TRANSFER-BSI",
      nama: "Transfer Bank BSI",
      tipe: "Manual Transfer",
      fee_type: "none",
      fee_amount: 0,
      instruksi: "Transfer ke rekening kampus, lalu upload bukti pembayaran.",
      bank_account_id: bankAccountId,
      integration_id: null,
      is_active: true,
      updated_by: keuanganUserId,
    },
    "kode",
    "Upsert metode transfer",
  );

  await ensureSingleByUpsert(
    "payment_methods",
    {
      kode: "VA-DUMMY",
      nama: "Virtual Account Dummy DEV",
      tipe: "VA Bank",
      fee_type: "fixed",
      fee_amount: 2500,
      instruksi: "Metode contoh DEV untuk validasi tampilan dan workflow.",
      bank_account_id: bankAccountId,
      integration_id: integrationId,
      is_active: true,
      updated_by: keuanganUserId,
    },
    "kode",
    "Upsert metode VA dummy",
  );

  await ensureSingleByUpsert(
    "beasiswa_diskon",
    {
      kode: "DISC-DEV-10",
      nama: "Diskon DEV 10 Persen",
      tipe: "Diskon",
      nilai: 10,
      satuan: "Persen",
      tahun_akademik_id: tahunAkademikId,
      prodi_id: programId,
      angkatan: 2026,
      kuota: 25,
      is_active: true,
      keterangan: "Contoh diskon DEV.",
      updated_by: keuanganUserId,
    },
    "kode",
    "Upsert diskon DEV",
  );

  const templates = [
    ["billing.manual_reminder.in_app", "Pengingat Tagihan", "billing.manual_reminder", "Pengingat pembayaran tagihan", "Tagihan {{jenis_tagihan}} sebesar {{nominal}} masih perlu dibayar sebelum {{jatuh_tempo}}.", ["jenis_tagihan", "nominal", "jatuh_tempo"]],
    ["billing.overdue.in_app", "Tagihan Lewat Tempo", "billing.overdue", "Tagihan sudah lewat tempo", "Tagihan {{jenis_tagihan}} sebesar {{nominal}} telah melewati jatuh tempo {{jatuh_tempo}}.", ["jenis_tagihan", "nominal", "jatuh_tempo"]],
    ["payment.rejected.in_app", "Pembayaran Ditolak", "payment.rejected", "Pembayaran ditolak", "Pembayaran {{jenis_tagihan}} sebesar {{nominal}} ditolak. Silakan cek kembali bukti pembayaran.", ["jenis_tagihan", "nominal"]],
  ];

  for (const [code, name, triggerEvent, subject, body, variables] of templates) {
    await ensureSingleByUpsert(
      "notification_templates",
      {
        code,
        name,
        channel: "in_app",
        trigger_event: triggerEvent,
        subject,
        body,
        variables,
        is_active: true,
      },
      "code",
      `Upsert template ${code}`,
    );
  }

  const idempotencyKey = `seed-dev-finance:billing.manual_reminder:${mahasiswaUserId}:${tagihanId}`;
  await ensureByMatch(
    "notifikasi",
    { idempotency_key: idempotencyKey },
    {
      id_user: mahasiswaUserId,
      judul: "Pengingat pembayaran tagihan",
      pesan: "Tagihan Praktikum Micro Teaching DEV masih perlu dibayar sebelum jatuh tempo.",
      href: `/dashboard/keuangan?tab=tagihan&tagihan=${tagihanId}`,
      type: "finance",
      related_type: "tagihan",
      related_id: tagihanId,
      idempotency_key: idempotencyKey,
      is_read: false,
    },
    "notifikasi finance DEV",
  );

  await ensureByMatch(
    "notification_queue",
    { idempotency_key: idempotencyKey },
    {
      user_id: mahasiswaUserId,
      channel: "in_app",
      event: "billing.manual_reminder",
      subject: "Pengingat pembayaran tagihan",
      body: "Tagihan Praktikum Micro Teaching DEV masih perlu dibayar sebelum jatuh tempo.",
      href: `/dashboard/keuangan?tab=tagihan&tagihan=${tagihanId}`,
      payload: { source: "seed:dev-finance", related_type: "tagihan", related_id: tagihanId },
      status: "sent",
      attempts: 1,
      run_at: new Date().toISOString(),
      sent_at: new Date().toISOString(),
      idempotency_key: idempotencyKey,
    },
    "notification queue finance DEV",
  );
}

async function main() {
  const [keuanganUserId, mahasiswaUserId, calonUserId] = await Promise.all([
    ensureAuthUser(credentials.keuangan),
    ensureAuthUser(credentials.mahasiswa),
    ensureAuthUser(credentials.calon),
  ]);
  const tahunAkademikId = await ensureActiveAcademicYear();
  const { programId } = await ensureFacultyAndProgram();
  const mahasiswaId = await ensureMahasiswa(mahasiswaUserId, programId);
  const masterBiayaId = await ensureMasterBiaya({ tahunAkademikId, programId });
  const paidTagihanId = await ensureTagihan({
    mahasiswaId,
    tahunAkademikId,
    masterBiayaId,
    jenis: "SPP Semester Genap DEV",
    nominal: 3000000,
    status: "Lunas",
  });

  const unpaidTagihanId = await ensureTagihan({
    mahasiswaId,
    tahunAkademikId,
    masterBiayaId,
    jenis: "Praktikum Micro Teaching DEV",
    nominal: 350000,
    status: "Belum Lunas",
  });

  const pembayaranId = await ensurePembayaran({ tagihanId: paidTagihanId, keuanganUserId });
  await ensureCashFlow({ pembayaranId, keuanganUserId });
  await ensurePmbFlow({ tahunAkademikId, programId, calonUserId, keuanganUserId });
  await ensureFinanceSetupSeed({ tahunAkademikId, programId, keuanganUserId, mahasiswaUserId, tagihanId: unpaidTagihanId });

  console.log("Seed DEV finance selesai.");
  console.log("Akun test DEV:");
  console.log(`- ${credentials.keuangan.email} / ${credentials.keuangan.password}`);
  console.log(`- ${credentials.mahasiswa.email} / ${credentials.mahasiswa.password}`);
  console.log(`- ${credentials.calon.email} / ${credentials.calon.password}`);
  console.log(`Trace ID: ${randomUUID()}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
