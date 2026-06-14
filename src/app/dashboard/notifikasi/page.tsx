import { requireAuthorizedUser } from "@/lib/auth";
import { getNotificationPreview } from "@/lib/admin/notifications";
import { NotificationList } from "@/modules/dashboard/notification-list";

export default async function NotifikasiPage() {
  const user = await requireAuthorizedUser("dashboard");
  const notificationPreview = await getNotificationPreview(user.id); // Placeholder for full list

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Notifikasi</h1>
        <p className="text-sm text-slate-500 font-medium">Lihat semua pemberitahuan dan informasi penting terkait aktivitas Anda.</p>
      </div>
      <NotificationList user={user} initialData={notificationPreview.items} />
    </div>
  );
}
