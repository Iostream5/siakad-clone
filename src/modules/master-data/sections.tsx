import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { MasterDataSnapshot } from "@/lib/admin/master-data";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function MasterDataQuickLinks({ snapshot }: { snapshot: MasterDataSnapshot }) {
  const items = [
    {
      href: "/dashboard/master-data/program-studi",
      label: "Program Studi",
      value: snapshot.counts.programStudi,
      caption: "Kelola struktur prodi aktif",
    },
    {
      href: "/dashboard/master-data/kampus",
      label: "Kampus",
      value: snapshot.counts.kampus,
      caption: "Identitas kampus utama",
    },
    {
      href: "/dashboard/master-data/fakultas",
      label: "Fakultas",
      value: snapshot.counts.fakultas,
      caption: "Kelola struktur fakultas kampus",
    },
    {
      href: "/dashboard/master-data/mata-kuliah",
      label: "Mata Kuliah",
      value: snapshot.counts.mataKuliah,
      caption: "Pantau katalog dan kurikulum",
    },
    {
      href: "/dashboard/master-data/kelas",
      label: "Kelas",
      value: snapshot.counts.kelas,
      caption: "Kelompok kelas akademik",
    },
    {
      href: "/dashboard/master-data/jadwal-kuliah",
      label: "Jadwal Kuliah",
      value: "-",
      caption: "Manajemen jadwal kelas, dosen, dan ruangan",
    },
    {
      href: "/dashboard/master-data/tahun-akademik",
      label: "Tahun Akademik",
      value: snapshot.counts.tahunAkademik,
      caption: "Status periode akademik",
    },
    {
      href: "/dashboard/master-data/kurikulum",
      label: "Kurikulum",
      value: snapshot.counts.kurikulum,
      caption: "Rencana studi dan total SKS",
    },
    {
      href: "/dashboard/master-data/mahasiswa",
      label: "Mahasiswa",
      value: snapshot.counts.mahasiswa,
      caption: "Profil dan status akademik",
    },
    {
      href: "/dashboard/master-data/ruangan",
      label: "Ruangan",
      value: snapshot.counts.ruangan || 0,
      caption: "Data gedung dan kapasitas",
    },
    {
      href: "/dashboard/master-data/pengguna",
      label: "Pengguna",
      value: snapshot.counts.users,
      caption: "Akun dan role operasional",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="block">
          <Card className="h-full border-slate-200 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_18px_30px_rgba(8,145,178,0.12)]">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{item.caption}</p>
          </Card>
        </Link>
      ))}
    </section>
  );
}

export function ProgramStudiSection({ snapshot }: { snapshot: MasterDataSnapshot }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Program Studi</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Data prodi dari database</h3>
        </div>
        <Badge>{snapshot.counts.programStudi} total</Badge>
      </div>

      <div className="mt-5 overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <TH>Kode</TH>
              <TH>Nama</TH>
              <TH>Jenjang</TH>
              <TH>Status</TH>
              <TH>Update</TH>
            </TR>
          </THead>
          <TBody>
            {snapshot.programStudi.map((item) => (
              <TR key={item.id}>
                <TD className="font-mono text-xs text-slate-700">{item.kode}</TD>
                <TD className="font-medium text-slate-900">{item.nama}</TD>
                <TD>{item.jenjang}</TD>
                <TD>
                  <Badge>{item.is_active ? "Aktif" : "Nonaktif"}</Badge>
                </TD>
                <TD>{formatDate(item.updated_at)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}

export function KampusSection({ snapshot }: { snapshot: MasterDataSnapshot }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Kampus</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Identitas kampus aktif</h3>
        </div>
        <Badge>{snapshot.counts.kampus} kampus</Badge>
      </div>

      <div className="mt-5 space-y-3">
        {snapshot.kampus.map((item) => (
          <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">{item.nama}</p>
              {item.is_active ? <Badge>Aktif</Badge> : <Badge variant="secondary">Nonaktif</Badge>}
            </div>
            <p className="mt-2 text-sm text-slate-600">{item.kode}</p>
            <p className="mt-1 text-sm text-slate-500">
              {item.alamat ?? "-"}{item.kota ? ` • ${item.kota}` : ""}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function MataKuliahSection({ snapshot }: { snapshot: MasterDataSnapshot }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Mata Kuliah</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Katalog mata kuliah terbaru</h3>
        </div>
        <Badge>{snapshot.counts.mataKuliah} mata kuliah</Badge>
      </div>

      <div className="mt-5 overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <TH>Kode</TH>
              <TH>Nama</TH>
              <TH>Prodi</TH>
              <TH>Semester</TH>
              <TH>SKS</TH>
              <TH>Jenis</TH>
            </TR>
          </THead>
          <TBody>
            {snapshot.mataKuliah.map((item) => (
              <TR key={item.id}>
                <TD className="font-mono text-xs text-slate-700">{item.kode}</TD>
                <TD>
                  <p className="font-medium text-slate-900">{item.nama}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.is_active ? "Aktif" : "Nonaktif"}</p>
                </TD>
                <TD>{item.program_studi?.nama ?? "-"}</TD>
                <TD>{item.semester}</TD>
                <TD>{item.sks}</TD>
                <TD>
                  <Badge>{item.jenis}</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}

export function TahunAkademikSection({ snapshot }: { snapshot: MasterDataSnapshot }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Tahun Akademik</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Periode dan status aktif</h3>
        </div>
        <Badge>{snapshot.counts.tahunAkademik} periode</Badge>
      </div>

      <div className="mt-5 space-y-3">
        {snapshot.tahunAkademik.map((item) => (
          <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">{item.nama}</p>
              {item.is_aktif ? <Badge>Aktif</Badge> : null}
              {item.is_krs_open ? <Badge>KRS Dibuka</Badge> : null}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {item.kode} | {item.semester}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(item.tanggal_mulai)} - {formatDate(item.tanggal_selesai)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function KelasSection({ snapshot }: { snapshot: MasterDataSnapshot }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Kelas</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Kelas akademik aktif</h3>
        </div>
        <Badge>{snapshot.counts.kelas} kelas</Badge>
      </div>

      <div className="mt-5 overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <TH>Kode</TH>
              <TH>Nama</TH>
              <TH>Prodi</TH>
              <TH>Detail</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {snapshot.kelas.map((item) => (
              <TR key={item.id}>
                <TD className="font-mono text-xs text-slate-700">{item.kode}</TD>
                <TD className="font-medium text-slate-900">{item.nama}</TD>
                <TD>{item.program_studi?.nama ?? "-"}</TD>
                <TD>
                  <p className="text-sm text-slate-600">{item.tingkat ?? "-"}</p>
                  <p className="text-xs text-slate-500">Angkatan {item.angkatan ?? "-" } • {item.kapasitas} kursi</p>
                </TD>
                <TD>
                  <Badge>{item.is_active ? "Aktif" : "Nonaktif"}</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}

export function KurikulumSection({ snapshot }: { snapshot: MasterDataSnapshot }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Kurikulum</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Peta kurikulum per prodi</h3>
        </div>
        <Badge>{snapshot.counts.kurikulum} kurikulum</Badge>
      </div>

      <div className="mt-5 overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <TH>Kode</TH>
              <TH>Kurikulum</TH>
              <TH>Prodi</TH>
              <TH>Detail</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {snapshot.kurikulum.map((item) => (
              <TR key={item.id}>
                <TD className="font-mono text-xs text-slate-700">{item.kode}</TD>
                <TD className="font-medium text-slate-900">{item.nama}</TD>
                <TD>{item.program_studi?.nama ?? "-"}</TD>
                <TD>
                  <p className="text-sm text-slate-600">{item.tahun_mulai}</p>
                  <p className="text-xs text-slate-500">{item.total_sks} SKS</p>
                </TD>
                <TD>
                  <Badge>{item.is_active ? "Aktif" : "Nonaktif"}</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}

export function PenggunaSection({ snapshot }: { snapshot: MasterDataSnapshot }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Pengguna</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Akun terbaru</h3>
        </div>
        <Badge>{snapshot.counts.users} akun</Badge>
      </div>

      <div className="mt-5 overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <TH>Nama</TH>
              <TH>Role</TH>
              <TH>Email</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {snapshot.users.map((item) => (
              <TR key={item.id}>
                <TD>
                  <p className="font-medium text-slate-900">{item.full_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(item.created_at)}</p>
                </TD>
                <TD>{item.role}</TD>
                <TD className="text-slate-600">{item.email}</TD>
                <TD>
                  <Badge>{item.is_active ? "Aktif" : "Nonaktif"}</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}

export function DosenSection({ snapshot }: { snapshot: MasterDataSnapshot }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Dosen</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Profil dosen terbaru</h3>
        </div>
        <Badge>{snapshot.counts.dosen} dosen</Badge>
      </div>

      <div className="mt-5 overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <TH>Nama</TH>
              <TH>NIDN</TH>
              <TH>Homebase</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {snapshot.dosen.map((item) => (
              <TR key={item.id}>
                <TD>
                  <p className="font-medium text-slate-900">{item.users?.full_name ?? "-"}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.users?.email ?? "-"}</p>
                </TD>
                <TD className="font-mono text-xs text-slate-700">{item.nidn ?? "-"}</TD>
                <TD>{item.program_studi?.nama ?? "-"}</TD>
                <TD>
                  <Badge>{item.status_dosen}</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}

export function MahasiswaSection({ snapshot }: { snapshot: MasterDataSnapshot }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Mahasiswa</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Profil mahasiswa terbaru</h3>
        </div>
        <Badge>{snapshot.counts.mahasiswa} mahasiswa</Badge>
      </div>

      <div className="mt-5 overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <TH>Mahasiswa</TH>
              <TH>NIM</TH>
              <TH>Prodi</TH>
              <TH>Angkatan</TH>
              <TH>Status</TH>
              <TH>IPS / IPK</TH>
            </TR>
          </THead>
          <TBody>
            {snapshot.mahasiswa.map((item) => (
              <TR key={item.id}>
                <TD className="font-medium text-slate-900">{item.users?.full_name ?? "-"}</TD>
                <TD className="font-mono text-xs text-slate-700">{item.nim ?? "-"}</TD>
                <TD>{item.program_studi?.nama ?? "-"}</TD>
                <TD>{item.angkatan}</TD>
                <TD>
                  <Badge>{item.status_mahasiswa}</Badge>
                </TD>
                <TD>
                  {item.ips.toFixed(2)} / {item.ipk.toFixed(2)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}
