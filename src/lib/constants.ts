import type {
  Announcement,
  BillingItem,
  DashboardMetric,
  KrsCourse,
  SessionUser,
  SidebarItem,
  UserRole,
} from "@/types/domain";

export const roles: UserRole[] = [
  "Admin",
  "Prodi",
  "Dosen",
  "Mahasiswa",
  "Calon Mahasiswa",
  "Staff",
  "Keuangan",
  "Pimpinan",
  "Bendahara",
];

export const demoUsers: Record<string, SessionUser & { password: string }> = {
  admin: {
    id: "usr-admin",
    name: "Admin SIAKAD",
    identifier: "admin",
    role: "Admin",
    availableRoles: ["Admin"],
    email: "admin@kampus.ac.id",
    password: "admin123",
  },
  prodi: {
    id: "usr-prodi",
    name: "Ketua Prodi Informatika",
    identifier: "prodi",
    role: "Prodi",
    availableRoles: ["Prodi"],
    email: "prodi@kampus.ac.id",
    password: "prodi123",
  },
  dosen: {
    id: "usr-dosen",
    name: "Dr. Ahmad Fauzi",
    identifier: "dosen",
    role: "Dosen",
    availableRoles: ["Dosen"],
    email: "dosen@kampus.ac.id",
    password: "dosen123",
  },
  mahasiswa: {
    id: "usr-mhs",
    name: "Nadia Putri",
    identifier: "mahasiswa",
    role: "Mahasiswa",
    availableRoles: ["Mahasiswa"],
    email: "mahasiswa@kampus.ac.id",
    password: "mhs12345",
  },
  staff: {
    id: "usr-staff",
    name: "Staff Akademik",
    identifier: "staff",
    role: "Staff",
    availableRoles: ["Staff"],
    email: "staff@kampus.ac.id",
    password: "staff123",
  },
  keuangan: {
    id: "usr-keu",
    name: "Biro Keuangan",
    identifier: "keuangan",
    role: "Keuangan",
    availableRoles: ["Keuangan"],
    email: "keuangan@kampus.ac.id",
    password: "keu12345",
  },
  pimpinan: {
    id: "usr-pimpinan",
    name: "Wakil Rektor",
    identifier: "pimpinan",
    role: "Pimpinan",
    availableRoles: ["Pimpinan"],
    email: "pimpinan@kampus.ac.id",
    password: "pimpinan123",
  },
};

export const sidebarItems: SidebarItem[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", roles },
  { key: "pengumuman", href: "/dashboard/pengumuman", label: "Pengumuman", roles: ["Admin", "Staff", "Prodi"] },
  {
    key: "master-data",
    href: "/dashboard/master-data",
    label: "Master Data",
    roles: ["Admin", "Prodi", "Staff"],
    children: [
      { key: "master-data.kampus", href: "/dashboard/master-data/kampus", label: "Kampus" },
      { key: "master-data.tahun-akademik", href: "/dashboard/master-data/tahun-akademik", label: "Tahun Akademik" },
      { key: "master-data.fakultas", href: "/dashboard/master-data/fakultas", label: "Fakultas" },
      { key: "master-data.program-studi", href: "/dashboard/master-data/program-studi", label: "Program Studi" },
      { key: "master-data.kelas", href: "/dashboard/master-data/kelas", label: "Kelas" },
      { key: "master-data.kurikulum", href: "/dashboard/master-data/kurikulum", label: "Kurikulum" },
      { key: "master-data.mata-kuliah", href: "/dashboard/master-data/mata-kuliah", label: "Mata Kuliah" },
      { key: "master-data.dosen", href: "/dashboard/master-data/dosen", label: "Dosen" },
      { key: "master-data.mahasiswa", href: "/dashboard/master-data/mahasiswa", label: "Mahasiswa" },
      { key: "master-data.ruangan", href: "/dashboard/master-data/ruangan", label: "Ruangan" },
      { key: "master-data.pengguna", href: "/dashboard/master-data/pengguna", label: "Pengguna" },
    ],
  },
  {
    key: "pmb",
    href: "/dashboard/pmb",
    label: "PMB",
    roles: ["Admin", "Prodi", "Staff", "Keuangan"],
    children: [
      { key: "pmb.overview", href: "/dashboard/pmb?tab=overview", label: "Dashboard PMB" },
      { key: "pmb.tarif", href: "/dashboard/pmb?tab=tarif", label: "Tarif PMB", roles: ["Admin", "Keuangan"] },
      { key: "pmb.pendaftar", href: "/dashboard/pmb?tab=pendaftar", label: "Pendaftar", roles: ["Admin", "Prodi", "Staff"] },
      { key: "pmb.pembayaran", href: "/dashboard/pmb?tab=pembayaran", label: "Pembayaran", roles: ["Admin", "Staff", "Keuangan"] },
      { key: "pmb.seleksi", href: "/dashboard/pmb?tab=seleksi", label: "Seleksi", roles: ["Admin", "Prodi", "Staff"] },
      { key: "pmb.registrasi", href: "/dashboard/pmb?tab=registrasi", label: "Registrasi/NIM", roles: ["Admin", "Prodi", "Staff"] },
    ],
  },
  { key: "registrasi", href: "/dashboard/registrasi", label: "Registrasi", roles: ["Admin", "Staff", "Keuangan", "Mahasiswa"] },
  { key: "krs", href: "/dashboard/krs", label: "KRS", roles: ["Admin", "Prodi", "Dosen", "Mahasiswa"] },
  { key: "nilai", href: "/dashboard/nilai", label: "Nilai", roles: ["Admin", "Prodi", "Dosen", "Mahasiswa"] },
  { key: "akademik.lms", href: "/dashboard/akademik/lms", label: "LMS", roles: ["Admin", "Prodi", "Dosen", "Mahasiswa"] },
  {
    key: "keuangan",
    href: "/dashboard/keuangan",
    label: "Keuangan",
    roles: ["Admin", "Keuangan", "Mahasiswa", "Calon Mahasiswa", "Pimpinan", "Bendahara"],
    children: [
      { key: "keuangan.setup", href: "/dashboard/keuangan?tab=setup", label: "Setup Keuangan", roles: ["Admin", "Keuangan"] },
      { key: "keuangan.pmb", href: "/dashboard/keuangan?tab=pmb", label: "Pembayaran PMB", roles: ["Calon Mahasiswa", "Mahasiswa"] },
      { key: "keuangan.overview", href: "/dashboard/keuangan?tab=summary", label: "Dashboard" },
      {
        key: "keuangan.transaksi",
        href: "/dashboard/keuangan?tab=transaksi",
        label: "Transaksi",
        roles: ["Admin", "Keuangan", "Bendahara"],
        children: [
          { key: "transaksi.penerimaan", href: "/dashboard/keuangan?tab=pembayaran", label: "Penerimaan Mhs" },
          { key: "transaksi.pengeluaran", href: "/dashboard/keuangan?tab=cashflow", label: "Pengeluaran Kas", roles: ["Admin", "Keuangan"] },
          { key: "transaksi.tagihan", href: "/dashboard/keuangan?tab=tagihan", label: "Tagihan" }
        ]
      },
      { key: "keuangan.laporan", href: "/dashboard/keuangan?tab=laporan", label: "Laporan Keuangan", roles: ["Admin", "Keuangan", "Pimpinan"] },
    ]
  },
  { key: "laporan", href: "/dashboard/laporan", label: "Laporan", roles: ["Admin", "Prodi", "Keuangan", "Pimpinan"] },
  {
    key: "pengaturan",
    href: "/dashboard/pengaturan",
    label: "Pengaturan",
    roles: ["Admin"],
    children: [
      { key: "pengaturan.akun-akses", href: "/dashboard/pengaturan/akun-akses", label: "Akun & Akses" },
      { key: "pengaturan.menu-builder", href: "/dashboard/pengaturan/menu-builder", label: "Menu Builder" },
      { key: "pengaturan.settings", href: "/dashboard/pengaturan/settings", label: "System Settings" },
      { key: "pengaturan.payment-gateway", href: "/dashboard/pengaturan/payment-gateway", label: "Payment Gateway" },
      { key: "pengaturan.template-notifikasi", href: "/dashboard/pengaturan/template-notifikasi", label: "Template Notifikasi" },
      { key: "pengaturan.audit-login", href: "/dashboard/pengaturan/audit-login", label: "Audit Login" },
      { key: "pengaturan.audit-aktivitas", href: "/dashboard/pengaturan/audit-aktivitas", label: "Audit Aktivitas" },
      { key: "pengaturan.developer-tools", href: "/dashboard/pengaturan/developer-tools", label: "Developer Tools" },
    ],
  },
];

export const announcementFeed: Announcement[] = [
  {
    id: "ann-1",
    title: "Periode KRS Semester Ganjil Dibuka",
    body: "Pengisian KRS dibuka 20 April sampai 3 Mei dengan approval dosen wali.",
    role: "Mahasiswa",
    createdAt: "17 Apr 2026",
  },
  {
    id: "ann-2",
    title: "Rekonsiliasi Pembayaran UKT",
    body: "Tim keuangan diminta menyelesaikan verifikasi bukti transfer maksimal H+1.",
    role: "Keuangan",
    createdAt: "16 Apr 2026",
  },
  {
    id: "ann-3",
    title: "Audit Trail Aktif",
    body: "Semua approval KRS, PMB, dan pembayaran kini tercatat otomatis di audit log.",
    role: "Semua",
    createdAt: "15 Apr 2026",
  },
];

export const dashboardMetrics: Record<UserRole | string, DashboardMetric[]> = {
  Admin: [
    { label: "Mahasiswa Aktif", value: "2.481", change: "+4.2%" },
    { label: "Tagihan Berjalan", value: "Rp3,4 M", change: "+8.1%" },
    { label: "Pengajuan PMB", value: "624", change: "+18%" },
  ],
  Prodi: [
    { label: "Kelas Berjalan", value: "84", change: "+6 kelas" },
    { label: "Approval KRS", value: "149", change: "27 menunggu" },
    { label: "Lulusan Tepat Waktu", value: "78%", change: "+5%" },
  ],
  Dosen: [
    { label: "Jadwal Mengajar", value: "12 kelas", change: "18 SKS" },
    { label: "Bimbingan Akademik", value: "32 mhs", change: "4 perlu review" },
    { label: "Input Nilai", value: "86%", change: "deadline 24 Apr" },
  ],
  Mahasiswa: [
    { label: "IPK", value: "3.72", change: "+0.11" },
    { label: "Tagihan Aktif", value: "Rp2.250.000", change: "1 jatuh tempo" },
    { label: "SKS Diambil", value: "21", change: "maks 24" },
  ],
  "Calon Mahasiswa": [
    { label: "Status PMB", value: "Aktif", change: "Pendaftaran" },
    { label: "Invoice PMB", value: "Menunggu", change: "Pembayaran" },
    { label: "Tahap Seleksi", value: "Belum", change: "Verifikasi" },
  ],
  Staff: [
    { label: "Dokumen PMB", value: "118", change: "23 belum valid" },
    { label: "Surat Akademik", value: "41", change: "9 perlu approval" },
    { label: "Import Data", value: "4 batch", change: "hari ini" },
  ],
  Keuangan: [
    { label: "Pembayaran Hari Ini", value: "Rp187 jt", change: "+12 transaksi" },
    { label: "Dispensasi", value: "17", change: "5 baru" },
    { label: "Piutang", value: "Rp812 jt", change: "-4.6%" },
  ],
  Bendahara: [
    { label: "Pembayaran Menunggu", value: "12", change: "3 urgent" },
    { label: "Tagihan Aktif", value: "Rp412 jt", change: "total mhs" },
  ],
  Pimpinan: [
    { label: "Pendapatan Semester", value: "Rp12,8 M", change: "+9.4%" },
    { label: "Rasio Registrasi", value: "93%", change: "+2.1%" },
    { label: "Kelulusan", value: "87%", change: "+3.5%" },
  ],
};

export const studentBilling: BillingItem[] = [
  {
    id: "bill-1",
    name: "UKT Semester Ganjil 2026/2027",
    amount: 2250000,
    dueDate: "24 Apr 2026",
    status: "Belum Lunas",
  },
  {
    id: "bill-2",
    name: "Praktikum Basis Data",
    amount: 350000,
    dueDate: "30 Apr 2026",
    status: "Dispensasi",
  },
];

export const offeredCourses: KrsCourse[] = [
  {
    code: "IF602",
    name: "Rekayasa Perangkat Lunak",
    sks: 3,
    className: "A",
    lecturer: "Dr. Ahmad Fauzi",
    schedule: "Senin, 09.40 - 12.10",
    room: "Lab 2",
    seatsLeft: 4,
    prerequisite: "IF401",
  },
  {
    code: "IF614",
    name: "Data Warehouse",
    sks: 3,
    className: "B",
    lecturer: "Nabila Hidayat, M.Kom",
    schedule: "Rabu, 13.00 - 15.30",
    room: "R-302",
    seatsLeft: 9,
  },
  {
    code: "IF622",
    name: "Keamanan Aplikasi",
    sks: 2,
    className: "A",
    lecturer: "Rizal Muttaqin, M.T.",
    schedule: "Kamis, 08.00 - 09.40",
    room: "R-210",
    seatsLeft: 3,
  },
];
