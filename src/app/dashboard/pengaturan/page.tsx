import { redirect } from "next/navigation";
import { requireAuthorizedUser } from "@/lib/auth";

export default async function PengaturanPage() {
  await requireAuthorizedUser("pengaturan");
  redirect("/dashboard/pengaturan/akun-akses");
}
