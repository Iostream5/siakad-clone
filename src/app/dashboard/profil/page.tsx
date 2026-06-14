import { connection } from "next/server";

import { getResolvedSessionUser } from "@/lib/auth";
import { ProfileManager } from "@/modules/dashboard/profile-manager";
import { redirect } from "next/navigation";

export default async function ProfilPage() {
  await connection();
  const sessionUser = await getResolvedSessionUser();

  if (!sessionUser) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profil Pengguna</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola informasi pribadi dan keamanan akun Anda.</p>
      </div>
      <ProfileManager user={sessionUser} />
    </div>
  );
}
