import { getActivityLogs } from "@/lib/admin/activity-audit";
import { requireAuthorizedUser } from "@/lib/auth";
import { AuditAktivitasView } from "./audit-aktivitas-view";
import { Suspense } from "react";

export default async function AuditAktivitasPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  await requireAuthorizedUser("pengaturan.audit-aktivitas", ["Admin"]);

  const modul = typeof searchParams.modul === 'string' ? searchParams.modul : undefined;
  const aksi = typeof searchParams.aksi === 'string' ? searchParams.aksi : undefined;

  const { rows, error } = await getActivityLogs(100, { modul, aksi });

  return (
    <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading aktivitas...</div>}>
      <AuditAktivitasView rows={rows} error={error} />
    </Suspense>
  );
}
