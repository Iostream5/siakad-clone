import { DashboardOverview } from "@/modules/dashboard/overview";
import { RecentActivityFeed } from "@/modules/dashboard/recent-activity";
import { requireAuthorizedUser } from "@/lib/auth";
import { getActiveAnnouncements } from "@/lib/admin/announcements";
import { getMasterDataSnapshot } from "@/lib/admin/master-data";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";

const DASHBOARD_DATA_TIMEOUT_MS = 2500;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutHandle = setTimeout(() => resolve(null), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

export default async function DashboardPage() {
  const user = await requireAuthorizedUser("dashboard");
  const [announcements, snapshot] = await Promise.all([
    withTimeout(getActiveAnnouncements(user.role), DASHBOARD_DATA_TIMEOUT_MS),
    withTimeout(getMasterDataSnapshot(), DASHBOARD_DATA_TIMEOUT_MS),
  ]);

  return (
    <div className="space-y-6">
      <DashboardOverview 
        user={user} 
        announcements={announcements ?? []} 
        stats={snapshot?.counts}
        activityFeed={
          <Suspense fallback={<Card className="h-96 animate-pulse bg-slate-50 border-slate-200" />}>
            <RecentActivityFeed />
          </Suspense>
        }
      />
    </div>
  );
}
