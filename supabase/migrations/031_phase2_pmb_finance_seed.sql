-- Seed Data PMB dan Finance (Phase 2)
-- Menambahkan data sample agar flow PMB dan Keuangan bisa diuji UI nya

do $$
declare
  -- Setup dummy data
  var_prodi_id uuid;
  var_tahun_akademik_id uuid;
  var_master_biaya_pmb_id uuid;
  var_pmb_pendaftaran_id uuid;
  var_pmb_pembayaran_id uuid;
  var_master_biaya_spp_id uuid;
  var_mahasiswa_id uuid;
  var_tagihan_id uuid;
  var_pembayaran_id uuid;
  var_user_id uuid;
begin
  -- Get existing prodi id
  select id into var_prodi_id from public.program_studi limit 1;
  -- Get existing tahun akademik id
  select id into var_tahun_akademik_id from public.tahun_akademik where is_active = true limit 1;

  if var_prodi_id is null or var_tahun_akademik_id is null then
    return; -- Cannot seed without prerequisites
  end if;

  -- 1. Master Biaya PMB
  insert into public.pmb_biaya (
    tahun_akademik_id, prodi_id, nama, jalur_pendaftaran, jenis_pendaftaran,
    gelombang, nominal, tanggal_mulai, tanggal_selesai, due_days, is_active, catatan
  ) values (
    var_tahun_akademik_id, var_prodi_id, 'Biaya Pendaftaran Gelombang 1', 'Reguler', 'Baru',
    'Gelombang 1', 250000, now(), now() + interval '30 days', 7, true, 'Seeded biaya PMB'
  ) returning id into var_master_biaya_pmb_id;

  -- 2. Pendaftar PMB
  insert into public.pmb_pendaftaran (
    nomor_pendaftaran, nama_lengkap, email, no_whatsapp, prodi_pilihan_id,
    jalur_pendaftaran, jenis_pendaftaran, tempat_lahir, tanggal_lahir,
    jenis_kelamin, alamat_lengkap, pendidikan_terakhir, asal_sekolah,
    jurusan_sekolah, tahun_lulus, kota_asal, nama_ayah, pekerjaan_ayah,
    nama_ibu, pekerjaan_ibu, no_hp_ortu, catatan,
    invoice_number, invoice_amount, invoice_due_at,
    status_pendaftaran, status_pembayaran, status_seleksi
  ) values (
    'PMB-2026-0001', 'Calon Mahasiswa Sample', 'calon@example.com', '081234567890', var_prodi_id,
    'Reguler', 'Baru', 'Jakarta', '2005-01-01',
    'Laki-laki', 'Jl. Sample No 1', 'SMA/MA', 'SMA N 1',
    'IPA', 2023, 'Jakarta', 'Ayah Sample', 'Pegawai Swasta',
    'Ibu Sample', 'Ibu Rumah Tangga', '081234567891', 'Catatan sample',
    'INV-PMB-2026001', 250000, now() + interval '7 days',
    'Waiting Payment', 'pending', 'BARU'
  ) returning id into var_pmb_pendaftaran_id;

  -- 3. PMB Pembayaran (Transfer Bank Manual)
  insert into public.pmb_pembayaran (
    pmb_pendaftaran_id, nominal, metode, bank_pengirim, nama_pengirim,
    status, catatan
  ) values (
    var_pmb_pendaftaran_id, 250000, 'Transfer Bank', 'BCA', 'Calon Mahasiswa Sample',
    'Terverifikasi', 'Dibayar lunas manual'
  ) returning id into var_pmb_pembayaran_id;

  -- Update PMB status as paid
  update public.pmb_pendaftaran
  set status_pembayaran = 'paid', status_pendaftaran = 'Verified', status_seleksi = 'VERIFIKASI'
  where id = var_pmb_pendaftaran_id;


  -- Get existing User (Mahasiswa) if exist
  select user_id into var_user_id from public.mahasiswa limit 1;
  select id into var_mahasiswa_id from public.mahasiswa where user_id = var_user_id;

  if var_user_id is not null and var_mahasiswa_id is not null then
    -- 4. Master Biaya Mahasiswa (SPP)
    insert into public.master_biaya (
      tahun_akademik_id, prodi_id, jenis, nominal, keterangan, is_active
    ) values (
      var_tahun_akademik_id, var_prodi_id, 'SPP', 3000000, 'SPP Semester Genap', true
    ) returning id into var_master_biaya_spp_id;

    -- 5. Tagihan Mahasiswa
    insert into public.tagihan (
      mahasiswa_id, tahun_akademik_id, master_biaya_id, jenis, nominal,
      status, jatuh_tempo, is_cicilan_allowed
    ) values (
      var_mahasiswa_id, var_tahun_akademik_id, var_master_biaya_spp_id, 'SPP', 3000000,
      'BELUM BAYAR', now() + interval '14 days', false
    ) returning id into var_tagihan_id;

    -- 6. Pembayaran Mahasiswa
    insert into public.pembayaran (
      tagihan_id, nominal, metode, bank_pengirim, nama_pengirim,
      status, mahasiswa_id, keterangan
    ) values (
      var_tagihan_id, 3000000, 'Transfer Bank', 'Mandiri', 'Mahasiswa Sample',
      'Terverifikasi', var_mahasiswa_id, 'Pembayaran SPP'
    ) returning id into var_pembayaran_id;

    -- Update Tagihan status as LUNAS
    update public.tagihan
    set status = 'LUNAS'
    where id = var_tagihan_id;
  end if;

end $$;
