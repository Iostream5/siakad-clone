import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getUserAccessContext } from "@/lib/admin/access-control";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();
  const access = await getUserAccessContext(user.id, user.role);

  return <DashboardShell user={{ ...user, role: access.resolvedRole }} items={access.sidebarItems}>{children}</DashboardShell>;
}
