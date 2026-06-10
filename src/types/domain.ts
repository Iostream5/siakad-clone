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
