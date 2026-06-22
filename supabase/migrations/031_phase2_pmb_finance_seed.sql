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
  select id into var_tahun_akademik_id from public.tahun_akademik where is_aktif = true limit 1;

  if var_prodi_id is null or var_tahun_akademik_id is null then
    return; -- Cannot seed without prerequisites
  end if;

  -- 1. Master Biaya PMB
  insert into public.pmb_biaya (
    tahun_akademik_id, prodi_id, nama, jalur_pendaftaran, jenis_pendaftaran,
    gelombang, nominal, tanggal_mulai, tanggal_selesai, due_days, is_active, catatan
  )
  select
    var_tahun_akademik_id, var_prodi_id, 'Biaya Pendaftaran Gelombang 1', 'Reguler', 'Baru',
    'Gelombang 1', 250000, now(), now() + interval '30 days', 7, true, 'Seeded biaya PMB'
  where not exists (
    select 1
    from public.pmb_biaya
    where tahun_akademik_id = var_tahun_akademik_id
      and prodi_id = var_prodi_id
      and nama = 'Biaya Pendaftaran Gelombang 1'
  )
  returning id into var_master_biaya_pmb_id;

  if var_master_biaya_pmb_id is null then
    select id into var_master_biaya_pmb_id
    from public.pmb_biaya
    where tahun_akademik_id = var_tahun_akademik_id
      and prodi_id = var_prodi_id
      and nama = 'Biaya Pendaftaran Gelombang 1'
    limit 1;
  end if;

  -- 2. Pendaftar PMB
  insert into public.pmb_pendaftaran (
    nomor_pendaftaran, nama_lengkap, email, no_hp, prodi_pilihan_id,
    jalur_pendaftaran, jenis_pendaftaran, tempat_lahir, tanggal_lahir,
    jenis_kelamin, alamat, pendidikan_terakhir, asal_sekolah,
    jurusan_sekolah, tahun_lulus, kota_asal, nama_ayah, pekerjaan_ayah,
    nama_ibu, pekerjaan_ibu, no_hp_orang_tua, catatan_panitia,
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
  )
  on conflict (nomor_pendaftaran) do update set
    nama_lengkap = excluded.nama_lengkap,
    email = excluded.email,
    prodi_pilihan_id = excluded.prodi_pilihan_id,
    invoice_number = excluded.invoice_number,
    invoice_amount = excluded.invoice_amount,
    invoice_due_at = excluded.invoice_due_at
  returning id into var_pmb_pendaftaran_id;

  -- 3. PMB Pembayaran (Transfer Bank Manual)
  insert into public.pmb_pembayaran (
    pmb_pendaftaran_id, nominal, metode, bank_pengirim, nama_pengirim,
    status, catatan
  )
  select
    var_pmb_pendaftaran_id, 250000, 'Transfer Bank', 'BCA', 'Calon Mahasiswa Sample',
    'Terverifikasi', 'Dibayar lunas manual'
  where not exists (
    select 1
    from public.pmb_pembayaran
    where pmb_pendaftaran_id = var_pmb_pendaftaran_id
      and metode = 'Transfer Bank'
  )
  returning id into var_pmb_pembayaran_id;

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
      tahun_akademik_id, prodi_id, nama, nominal, keterangan, is_active, status
    )
    select
      var_tahun_akademik_id, var_prodi_id, 'SPP', 3000000, 'SPP Semester Genap', true, true
    where not exists (
      select 1
      from public.master_biaya
      where tahun_akademik_id = var_tahun_akademik_id
        and prodi_id = var_prodi_id
        and nama = 'SPP'
    )
    returning id into var_master_biaya_spp_id;

    if var_master_biaya_spp_id is null then
      select id into var_master_biaya_spp_id
      from public.master_biaya
      where tahun_akademik_id = var_tahun_akademik_id
        and prodi_id = var_prodi_id
        and nama = 'SPP'
      limit 1;
    end if;

    -- 5. Tagihan Mahasiswa
    insert into public.tagihan (
      mahasiswa_id, tahun_akademik_id, master_biaya_id, jenis, nominal,
      status, jatuh_tempo
    )
    select
      var_mahasiswa_id, var_tahun_akademik_id, var_master_biaya_spp_id, 'SPP', 3000000,
      'Belum Lunas', now() + interval '14 days'
    where not exists (
      select 1
      from public.tagihan
      where mahasiswa_id = var_mahasiswa_id
        and tahun_akademik_id = var_tahun_akademik_id
        and jenis = 'SPP'
    )
    returning id into var_tagihan_id;

    if var_tagihan_id is null then
      select id into var_tagihan_id
      from public.tagihan
      where mahasiswa_id = var_mahasiswa_id
        and tahun_akademik_id = var_tahun_akademik_id
        and jenis = 'SPP'
      limit 1;
    end if;

    -- 6. Pembayaran Mahasiswa
    insert into public.pembayaran (
      tagihan_id, nominal, metode, bank_pengirim, nama_pengirim,
      status
    )
    select
      var_tagihan_id, 3000000, 'Transfer Bank', 'Mandiri', 'Mahasiswa Sample',
      'Terverifikasi'
    where not exists (
      select 1
      from public.pembayaran
      where tagihan_id = var_tagihan_id
        and metode = 'Transfer Bank'
    )
    returning id into var_pembayaran_id;

    -- Update Tagihan status as LUNAS
    update public.tagihan
    set status = 'Lunas'
    where id = var_tagihan_id;
  end if;

end $$;
