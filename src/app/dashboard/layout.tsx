import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getUserAccessContext } from "@/lib/admin/access-control";
import { getNotificationPreview } from "@/lib/admin/notifications";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();
  const [access, notificationPreview] = await Promise.all([
    getUserAccessContext(user.id, user.role),
    getNotificationPreview(user.id),
  ]);

  return (
    <DashboardShell
      user={{ ...user, role: access.resolvedRole }}
      items={access.sidebarItems}
      notificationPreview={notificationPreview}
    >
      {children}
    </DashboardShell>
  );
}
