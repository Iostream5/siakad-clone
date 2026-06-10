import type { UserRole } from "@/types/domain";

export function getDefaultRolePath(role: UserRole) {
  switch (role) {
    case "Calon Mahasiswa":
      return "/dashboard/keuangan?tab=pmb";
    case "Mahasiswa":
      return "/dashboard/keuangan";
    case "Dosen":
      return "/dashboard/nilai";
    case "Keuangan":
      return "/dashboard/keuangan";
    case "Pimpinan":
      return "/dashboard/laporan";
    default:
      return "/dashboard";
  }
}
