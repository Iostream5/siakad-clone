import Link from "next/link";

import { saveRoleAccessAction, saveUserRolesAction } from "@/actions/access-control";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAccountAccessPageData } from "@/lib/admin/access-control";
import { menuDefinitions } from "@/lib/access-control";
import { requireAuthorizedUser } from "@/lib/auth";
import { roles, sidebarItems } from "@/lib/constants";
import { RolePanel } from "@/modules/shared/role-panel";

type AccountAccessPageProps = {
  searchParams?: Promise<{
    user?: string;
    role?: string;
  }>;
};

export default async function AccountAccessPage({ searchParams }: AccountAccessPageProps) {
  const user = await requireAuthorizedUser("pengaturan.akun-akses", ["Admin"]);
  const params = await searchParams;
  const selectedUserId = params?.user;
  const selectedRoleParam = params?.role;
  const pageData = await getAccountAccessPageData(selectedUserId, selectedRoleParam);
  const selectedUser = pageData.selectedUser;
  const allowedMenuKeys = new Set(pageData.allowedMenuKeys);

  return (
    <div className="space-y-6">

      {pageData.error ? (
        <Card className="border-amber-200 bg-amber-50/85">
          <p className="text-sm font-semibold text-amber-900">{pageData.error}</p>
        </Card>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.28fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">User Roles</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">Pilih akun dan kelola multi-role</h3>
            </div>
            <Badge>{pageData.users.length} akun</Badge>
          </div>

          <div className="mt-5 space-y-3">
            {pageData.users.map((item) => {
              const active = item.id === selectedUser?.id;

              return (
                <Link
                  key={item.id}
                  href={`/dashboard/pengaturan/akun-akses?user=${item.id}&role=${pageData.selectedRole}`}
                  className={`block rounded-2xl border px-4 py-3 transition ${
                    active
                      ? "border-cyan-200 bg-cyan-50 shadow-[0_10px_22px_rgba(6,182,212,0.12)]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{item.full_name}</p>
                      <p className="mt-1 truncate text-sm text-slate-500">{item.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.availableRoles.map((role) => (
                          <Badge key={role} className={role === item.role ? "bg-slate-900 text-white" : undefined}>
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge>{item.role}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Role per Pengguna</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Multi-role dan role aktif</h3>
              </div>
              {selectedUser ? <Badge>{selectedUser.role}</Badge> : null}
            </div>

            {selectedUser ? (
              <form action={saveUserRolesAction} className="mt-5 space-y-6">
                <input type="hidden" name="userId" value={selectedUser.id} />

                <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Pengguna terpilih</p>
                    <h4 className="mt-2 text-lg font-semibold text-slate-950">{selectedUser.full_name}</h4>
                    <p className="mt-1 text-sm text-slate-600">{selectedUser.email}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedUser.availableRoles.map((role) => (
                        <Badge key={role} className={role === selectedUser.role ? "bg-slate-900 text-white" : undefined}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-800">Role aktif workspace</label>
                    <select
                      name="activeRole"
                      defaultValue={selectedUser.role}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[var(--primary)]"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Role aktif menentukan dashboard, sidebar, dan guard halaman yang dipakai user saat login.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Role yang dimiliki user</p>
                    <p className="mt-1 text-sm text-slate-500">User bisa punya lebih dari satu role. Role aktif harus termasuk di checklist ini.</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {roles.map((role) => {
                      const checked = selectedUser.availableRoles.includes(role);

                      return (
                        <label key={role} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <input
                            type="checkbox"
                            name="roles"
                            value={role}
                            defaultChecked={checked}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                          <span className="min-w-0">
                            <span className="block font-semibold text-slate-900">{role}</span>
                            <span className="mt-1 block text-sm text-slate-500">
                              {role === selectedUser.role ? "Saat ini menjadi role aktif." : "Bisa dipilih sebagai role tambahan."}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                  <p className="text-sm text-slate-500">Pengguna tidak lagi diatur menu satu per satu. Pengaturan akses mengikuti role yang dipasang ke user.</p>
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,118,110,0.2)] hover:brightness-105"
                  >
                    Simpan role pengguna
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Belum ada akun yang bisa diatur.
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-500">Role Access</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Menu yang dapat dibuka oleh setiap role</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Link
                    key={role}
                    href={`/dashboard/pengaturan/akun-akses?${selectedUser ? `user=${selectedUser.id}&` : ""}role=${role}`}
                    className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition ${
                      pageData.selectedRole === role
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {role}
                  </Link>
                ))}
              </div>
            </div>

            <form action={saveRoleAccessAction} className="mt-5 space-y-6">
              <input type="hidden" name="role" value={pageData.selectedRole} />
              <input type="hidden" name="selectedUserId" value={selectedUser?.id ?? ""} />

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Role yang sedang dikonfigurasi</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h4 className="text-lg font-semibold text-slate-950">{pageData.selectedRole}</h4>
                  <Badge>{allowedMenuKeys.size} menu aktif</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Default menu berasal dari definisi sistem. Checklist di bawah menyimpan override khusus per role, bukan per user.
                </p>
              </div>

              <div className="grid gap-4">
                {sidebarItems.map((item) => {
                  const definition = menuDefinitions.find((entry) => entry.key === item.key);
                  const defaultAllowed = definition ? definition.roles.includes(pageData.selectedRole) : false;

                  return (
                    <div key={item.key} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <label className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          name="menuKeys"
                          value={item.key}
                          defaultChecked={allowedMenuKeys.has(item.key)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-900">{item.label}</span>
                          <span className="mt-1 block text-sm text-slate-500">
                            Default role: {item.roles.join(", ")}. {defaultAllowed ? "Termasuk akses bawaan role ini." : "Saat ini hanya terbuka jika diizinkan manual."}
                          </span>
                        </span>
                      </label>

                      {item.children?.length ? (
                        <div className="mt-4 grid gap-2 pl-7">
                          {item.children.map((child) => {
                            const childDefinition = menuDefinitions.find((entry) => entry.key === child.key);
                            const childDefaultAllowed = childDefinition ? childDefinition.roles.includes(pageData.selectedRole) : false;

                            return (
                              <label key={child.key} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                                <input
                                  type="checkbox"
                                  name="menuKeys"
                                  value={child.key}
                                  defaultChecked={allowedMenuKeys.has(child.key)}
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                                />
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-slate-900">{child.label}</span>
                                  <span className="mt-1 block text-xs text-slate-500">
                                    {childDefaultAllowed ? "Submenu bawaan role." : "Submenu tambahan khusus role ini."}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                <p className="text-sm text-slate-500">Perubahan ini berlaku ke semua user yang memiliki role {pageData.selectedRole}.</p>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,118,110,0.2)] hover:brightness-105"
                >
                  Simpan akses role
                </button>
              </div>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
}
