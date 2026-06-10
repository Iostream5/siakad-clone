import { Database, ShieldCheck, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getSystemSettings, type JsonValue, type SystemSettingRow } from "@/lib/admin/phase1-admin";
import { requireAuthorizedUser } from "@/lib/auth";

function formatValue(value: JsonValue, isSecret: boolean) {
  if (isSecret) {
    return "Tersimpan sebagai konfigurasi rahasia";
  }

  if (value && typeof value === "object" && !Array.isArray(value) && "value" in value) {
    const innerValue = value.value;
    return typeof innerValue === "string" ? innerValue : JSON.stringify(innerValue);
  }

  return typeof value === "string" ? value : JSON.stringify(value);
}

function groupSettings(rows: SystemSettingRow[]) {
  return rows.reduce<Record<string, SystemSettingRow[]>>((groups, row) => {
    const key = row.category || "system";
    groups[key] = [...(groups[key] ?? []), row];
    return groups;
  }, {});
}

export default async function SystemSettingsPage() {
  await requireAuthorizedUser("pengaturan.settings", ["Admin"]);
  const settings = await getSystemSettings();
  const groupedSettings = groupSettings(settings.rows);
  const activeCount = settings.rows.filter((row) => row.is_active).length;
  const secretCount = settings.rows.filter((row) => row.is_secret).length;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-50 text-lime-700">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Phase 1 Admin</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">System Settings</h2>
              <p className="mt-1 text-sm text-slate-600">
                Konfigurasi kampus, notifikasi, dan integrasi masa depan dari prompt aplikasi.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-lg font-bold text-slate-950">{settings.rows.length}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Setting</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-lg font-bold text-emerald-800">{activeCount}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Aktif</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-lg font-bold text-amber-800">{secretCount}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Secret</p>
            </div>
          </div>
        </div>
      </Card>

      {settings.error ? (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-5 w-5 text-amber-700" />
            <div>
              <p className="font-semibold text-amber-950">Menggunakan fallback konfigurasi</p>
              <p className="mt-1 text-sm text-amber-800">{settings.error}</p>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6">
        {Object.entries(groupedSettings).map(([category, rows]) => (
          <Card key={category} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm text-slate-500">Kategori</p>
                <h3 className="mt-1 text-xl font-semibold capitalize text-slate-950">{category}</h3>
              </div>
              <Badge variant={settings.source === "database" ? "success" : "secondary"}>
                {settings.source === "database" ? "Database" : "Fallback"}
              </Badge>
            </div>

            <div className="mt-4 overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Key</TH>
                    <TH>Nilai</TH>
                    <TH>Status</TH>
                    <TH>Deskripsi</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((row) => (
                    <TR key={row.id}>
                      <TD>
                        <p className="font-mono text-xs font-semibold text-slate-900">{row.key}</p>
                        {row.is_secret ? (
                          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            secret-aware
                          </span>
                        ) : null}
                      </TD>
                      <TD className="max-w-xs">
                        <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                          {formatValue(row.value, row.is_secret)}
                        </p>
                      </TD>
                      <TD>
                        <Badge variant={row.is_active ? "success" : "secondary"}>{row.is_active ? "Aktif" : "Nonaktif"}</Badge>
                      </TD>
                      <TD className="max-w-md text-sm text-slate-600">{row.description ?? "-"}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
