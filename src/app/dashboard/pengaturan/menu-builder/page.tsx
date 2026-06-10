import { connection } from "next/server";

import { listMenus } from "@/lib/admin/menus";
import { requireAuthorizedUser } from "@/lib/auth";
import { MenuBuilderManager } from "@/modules/settings/menu-builder-manager";

type MenuBuilderPageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
  }>;
};

export default async function MenuBuilderPage({ searchParams }: MenuBuilderPageProps) {
  await connection();

  await requireAuthorizedUser("pengaturan.menu-builder", ["Admin"]);
  const params = await searchParams;
  const page = Number(params?.page ?? "1");
  const data = await listMenus({
    query: params?.q,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <MenuBuilderManager {...data} />
    </div>
  );
}
