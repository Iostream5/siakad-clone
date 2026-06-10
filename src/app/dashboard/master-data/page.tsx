import { connection } from "next/server";

import { Card } from "@/components/ui/card";
import { getMasterDataSnapshot } from "@/lib/admin/master-data";
import { requireAuthorizedUser } from "@/lib/auth";
import {
  DosenSection,
  KelasSection,
  KampusSection,
  MahasiswaSection,
  MasterDataQuickLinks,
  MataKuliahSection,
  KurikulumSection,
  PenggunaSection,
  ProgramStudiSection,
  TahunAkademikSection,
} from "@/modules/master-data/sections";
import { RolePanel } from "@/modules/shared/role-panel";

export default async function MasterDataPage() {
  await connection();

  const user = await requireAuthorizedUser("master-data");
  const snapshot = await getMasterDataSnapshot();

  return (
    <div className="space-y-6">
      <MasterDataQuickLinks snapshot={snapshot} />

      {snapshot.error ? (
        <Card className="border-amber-200 bg-amber-50/80">
          <p className="text-sm font-semibold text-amber-900">Data master belum bisa dimuat penuh</p>
          <p className="mt-2 text-sm leading-6 text-amber-800">{snapshot.error}</p>
        </Card>
      ) : null}

      <KampusSection snapshot={snapshot} />
      <ProgramStudiSection snapshot={snapshot} />
      <KelasSection snapshot={snapshot} />
      <MataKuliahSection snapshot={snapshot} />
      <KurikulumSection snapshot={snapshot} />
      <TahunAkademikSection snapshot={snapshot} />
      <PenggunaSection snapshot={snapshot} />
      <DosenSection snapshot={snapshot} />
      <MahasiswaSection snapshot={snapshot} />
    </div>
  );
}
