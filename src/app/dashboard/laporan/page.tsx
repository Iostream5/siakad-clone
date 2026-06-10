import { requireAuthorizedUser } from "@/lib/auth";
import { ReportPanel } from "@/modules/reports/report-panel";
import { RolePanel } from "@/modules/shared/role-panel";

export default async function ReportsPage() {
  const user = await requireAuthorizedUser("laporan", ["Admin", "Prodi", "Keuangan", "Pimpinan"]);

  return (
    <div className="space-y-6">
      <ReportPanel />
    </div>
  );
}
