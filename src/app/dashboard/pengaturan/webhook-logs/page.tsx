import { requireAuthorizedUser } from "@/lib/auth";
import { getWebhookLogs } from "@/lib/admin/webhook-logs";
import { WebhookLogsView } from "./webhook-logs-view";
import { Suspense } from "react";

export default async function WebhookLogsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  await requireAuthorizedUser("pengaturan.payment-gateway", ["Admin"]);

  const provider = typeof searchParams.provider === 'string' ? searchParams.provider : undefined;

  const { rows, error } = await getWebhookLogs(100, provider);

  return (
    <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading webhook logs...</div>}>
      <WebhookLogsView rows={rows} error={error} />
    </Suspense>
  );
}
