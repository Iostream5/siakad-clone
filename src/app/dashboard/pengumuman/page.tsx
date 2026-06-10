import { connection } from "next/server";

import { listAllAnnouncements } from "@/lib/admin/announcements";
import { requireAuthorizedUser } from "@/lib/auth";
import { AnnouncementsManager } from "@/modules/master-data/announcements-manager";

export default async function PengumumanPage() {
  await connection();
  await requireAuthorizedUser("pengumuman", ["Admin", "Staff", "Prodi"]);
  const items = await listAllAnnouncements();

  return (
    <div className="space-y-6">
      <AnnouncementsManager items={items} />
    </div>
  );
}
