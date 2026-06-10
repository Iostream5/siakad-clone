import { connection } from "next/server";

import { listUsers } from "@/lib/admin/master-data";
import { requireAuthorizedUser } from "@/lib/auth";
import { UserManager } from "@/modules/master-data/user-manager";

export default async function PenggunaPage(props: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await connection();
  const searchParams = await props.searchParams;
  const query = searchParams.q ?? "";
  const page = Number(searchParams.page ?? "1");

  await requireAuthorizedUser("master-data.pengguna");
  const data = await listUsers({ query, page, pageSize: 10 });

  return (
    <div className="space-y-6">
      <UserManager {...data} />
    </div>
  );
}
