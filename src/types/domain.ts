export type UserRole =
  | "Admin"
  | "Prodi"
  | "Dosen"
  | "Mahasiswa"
  | "Calon Mahasiswa"
  | "Staff"
  | "Keuangan"
  | "Bendahara"
  | "Pimpinan";

export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  role: UserRole | "Semua";
  createdAt: string;
};

export type BillingItem = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: "Lunas" | "Belum Lunas" | "Dispensasi";
};

export type KrsCourse = {
  code: string;
  name: string;
  sks: number;
  className: string;
  lecturer: string;
  schedule: string;
  room: string;
  seatsLeft: number;
  prerequisite?: string;
};

export type SidebarItem = {
  key: string;
  href: string;
  label: string;
  roles: UserRole[];
  children?: Array<{
    key: string;
    href: string;
    label: string;
    roles?: UserRole[];
    children?: Array<{
      key: string;
      href: string;
      label: string;
      roles?: UserRole[];
    }>;
  }>;
};

export type LoginState = {
  error?: string;
};

export type SessionUser = {
  id: string;
  name: string;
  identifier: string;
  role: UserRole;
  availableRoles: UserRole[];
  email: string;
};

export type KrsSubmissionItem = {
  id: string;
  status: string;
  total_sks: number;
  updated_at: string;
  mahasiswa: {
    id: string;
    nim: string | null;
    users: { full_name: string } | { full_name: string }[] | null;
    program_studi: { nama: string } | { nama: string }[] | null;
  } | {
    id: string;
    nim: string;
    users: { full_name: string } | { full_name: string }[] | null;
    program_studi: { nama: string } | { nama: string }[] | null;
  }[] | null;
};

export type StudentGradeItem = {
  id: string;
  id_kelas: string;
  nilai_akhir: number;
  grade: string;
  is_publish: boolean;
  kelas: {
    id: string;
    nama_kelas: string;
    mata_kuliah: {
      kode: string;
      nama: string;
      sks: number;
    } | { kode: string; nama: string; sks: number; }[] | null;
  } | {
    id: string;
    nama_kelas: string;
    mata_kuliah: {
      kode: string;
      nama: string;
      sks: number;
    } | { kode: string; nama: string; sks: number; }[] | null;
  }[] | null;
};

export type LecturerClassItem = {
  id: string;
  nama_kelas: string;
  mata_kuliah: {
    kode: string;
    nama: string;
    sks: number;
  } | { kode: string; nama: string; sks: number; }[] | null;
};

export type MahasiswaProfile = {
  id: string;
  nim: string | null;
  user_id?: string | null;
  prodi_id?: string | null;
  users: { full_name: string } | { full_name: string }[] | null;
  program_studi: { nama: string } | { nama: string }[] | null;
};

export type LmsClassItem = {
  id: string;
  nama_kelas: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string;
  mata_kuliah: {
    nama: string;
    kode: string;
    sks: number;
  } | { nama: string; kode: string; sks: number; }[] | null;
  tahun_akademik?: {
    nama: string;
    is_aktif: boolean;
  } | { nama: string; is_aktif: boolean; }[] | null;
  dosen?: {
    users: { full_name: string } | null;
  } | { users: { full_name: string } | null; }[] | null;
};

export type AuditAktivitasItem = {
  id: string;
  created_at: string;
  modul: string;
  user_full_name?: string;
  user_role?: string;
  aksi: string;
  table_name: string;
  record_id: string | null;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
};

export type WebhookLogItem = {
  id: string;
  created_at: string;
  provider: string;
  event_type: string;
  event_id: string;
  payload: Record<string, unknown> | null;
};

export type AuditLoginItem = {
  id: string;
  created_at: string;
  user_full_name?: string;
  identifier?: string;
  status: "SUCCESS" | "FAILED";
  ip_address?: string;
  user_agent?: string;
  message?: string;
};

export type AuditLoginRowItem = {
  id: string;
  created_at: string;
  aksi: string;
  new_data?: { identifier?: string; message?: string } | null;
  id_user?: string | null;
};
