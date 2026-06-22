import { DashboardOverview } from "@/modules/dashboard/overview";
import { CalonMahasiswaDashboard } from "@/modules/dashboard/calon-mahasiswa-dashboard";
import { PimpinanOverview } from "@/modules/dashboard/pimpinan-overview";
import { MahasiswaDashboard } from "@/modules/dashboard/mahasiswa-dashboard";
import { DosenDashboard } from "@/modules/dashboard/dosen-dashboard";
import { KeuanganDashboard } from "@/modules/dashboard/keuangan-dashboard";
import { ProdiDashboard } from "@/modules/dashboard/prodi-dashboard";
import { RecentActivityFeed } from "@/modules/dashboard/recent-activity";
import { requireAuthorizedUser } from "@/lib/auth";
import { getActiveAnnouncements } from "@/lib/admin/announcements";
import { getNotificationPreview } from "@/lib/admin/notifications";
import { getPmbPaymentPortal } from "@/lib/admin/pmb";
import { getMahasiswaPostNimFlow } from "@/lib/admin/mahasiswa-post-nim-flow";
import { getMasterDataSnapshot } from "@/lib/admin/master-data";
import { getDashboardPimpinanStats } from "@/lib/admin/reports";
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

  // Specific view for Pimpinan
  if (user.role === "Pimpinan") {
    const pimpinanStats = await getDashboardPimpinanStats();
    return (
      <div className="space-y-6">
        <PimpinanOverview user={user} stats={pimpinanStats} />
      </div>
    );
  }

  if (user.role === "Calon Mahasiswa") {
    const [portal, notifications] = await Promise.all([
      getPmbPaymentPortal(user.id),
      getNotificationPreview(user.id),
    ]);

    return (
      <div className="space-y-6">
        <CalonMahasiswaDashboard user={user} portal={portal} notifications={notifications} />
      </div>
    );
  }

  if (user.role === "Mahasiswa") {
    const flow = await withTimeout(getMahasiswaPostNimFlow(user.id), DASHBOARD_DATA_TIMEOUT_MS + 2500);

    return (
      <div className="space-y-6">
        <MahasiswaDashboard user={user} flow={flow} />
      </div>
    );
  }

  const [announcements, snapshot] = await Promise.all([
    withTimeout(getActiveAnnouncements(user.role), DASHBOARD_DATA_TIMEOUT_MS),
    withTimeout(getMasterDataSnapshot(), DASHBOARD_DATA_TIMEOUT_MS),
  ]);

  if (user.role === "Dosen") {
    return (
      <div className="space-y-6">
        <DosenDashboard user={user} stats={snapshot?.counts} />
      </div>
    );
  }

  if (user.role === "Keuangan") {
    return (
      <div className="space-y-6">
        <KeuanganDashboard user={user} stats={snapshot?.counts} />
      </div>
    );
  }

  if (user.role === "Prodi") {
    return (
      <div className="space-y-6">
        <ProdiDashboard user={user} stats={snapshot?.counts} />
      </div>
    );
  }

  // Default view for Admin and others
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
