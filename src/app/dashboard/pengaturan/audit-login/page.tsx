import { getAuthAuditLogs } from "@/lib/admin/auth-audit";
import { requireAuthorizedUser } from "@/lib/auth";
import { AuditLoginView } from "./audit-login-view";
import { Suspense } from "react";

export default async function AuditLoginPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  await requireAuthorizedUser("pengaturan.audit-login", ["Admin"]);

  const status = typeof searchParams.status === 'string' ? searchParams.status : undefined;

  const { rows, error } = await getAuthAuditLogs(120, { status });

  // Provide full unfiltered counts for context
  const { rows: allRows } = await getAuthAuditLogs(120);
  const successCount = allRows.filter((item) => item.aksi === "LOGIN_SUCCESS").length;
  const failedCount = allRows.filter((item) => item.aksi === "LOGIN_FAILED").length;

  return (
    <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading audit...</div>}>
      <AuditLoginView rows={rows} error={error} successCount={successCount} failedCount={failedCount} />
    </Suspense>
  );
}
