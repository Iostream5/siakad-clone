"use client";
import { AuditAktivitasItem } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, User, Database, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function AuditAktivitasView({ rows, error }: { rows: AuditAktivitasItem[], error: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentModul = searchParams.get('modul') || 'all';
  const currentAksi = searchParams.get('aksi') || 'all';

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <History className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Log Enterprise</p>
              <h3 className="text-2xl font-bold text-slate-900">Audit Aktivitas</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 border border-slate-100">
            <Info className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600">Total {rows.length} log terbaru</span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4">
          <Select value={currentModul} onValueChange={(val) => handleFilterChange('modul', val)}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Semua Modul" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Modul</SelectItem>
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="roles">Roles</SelectItem>
              <SelectItem value="pmb">PMB</SelectItem>
              <SelectItem value="akademik">Akademik</SelectItem>
              <SelectItem value="keuangan">Keuangan</SelectItem>
            </SelectContent>
          </Select>

          <Select value={currentAksi} onValueChange={(val) => handleFilterChange('aksi', val)}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Semua Aksi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aksi</SelectItem>
              <SelectItem value="CREATE">CREATE</SelectItem>
              <SelectItem value="UPDATE">UPDATE</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : null}

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Waktu & Modul</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Pelaku</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Aksi</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Data Terkait</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-slate-500" colSpan={5}>
                    Belum ada aktivitas yang tercatat.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{formatDate(row.created_at)}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Database className="h-3 w-3" />
                        {row.modul}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{row.user_full_name}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">{row.user_role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={cn(
                          "px-2 py-0.5 font-bold uppercase text-[10px]",
                          row.aksi === "UPDATE" ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200" :
                          row.aksi === "DELETE" ? "bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200" :
                          row.aksi === "CREATE" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" :
                          "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        {row.aksi}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600 font-mono text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
                        {row.table_name}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                        ID: {row.record_id?.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs transition-colors"
                        onClick={() => alert(JSON.stringify(row.new_data || row.old_data, null, 2))}
                      >
                        Lihat JSON
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
