import { Card } from "@/components/ui/card";
import { requireAuthorizedUser } from "@/lib/auth";
import { RolePanel } from "@/modules/shared/role-panel";

export default async function RegistrationPage() {
  const user = await requireAuthorizedUser("registrasi", ["Admin", "Staff", "Keuangan", "Mahasiswa"]);

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-sm text-slate-500">Registrasi Semester</p>
        <h3 className="mt-1 text-xl font-semibold text-slate-900">Daftar ulang berbasis pembayaran</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-emerald-50 p-5 text-sm text-emerald-800">1. Mahasiswa submit daftar ulang</div>
          <div className="rounded-3xl bg-amber-50 p-5 text-sm text-amber-800">2. Keuangan verifikasi pelunasan atau dispensasi</div>
          <div className="rounded-3xl bg-slate-100 p-5 text-sm text-slate-700">3. Status semester berubah menjadi selesai</div>
        </div>
      </Card>
    </div>
  );
}
