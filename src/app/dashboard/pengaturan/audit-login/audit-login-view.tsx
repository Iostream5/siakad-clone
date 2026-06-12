"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

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

export function AuditLoginView({ rows, error, successCount, failedCount }: { rows: any[], error: string | null, successCount: number, failedCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get('status') || 'all';

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm text-slate-500">Monitoring Akses</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">Audit Login</h3>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={currentStatus} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="SUCCESS">Sukses</SelectItem>
                <SelectItem value="FAILED">Gagal</SelectItem>
              </SelectContent>
            </Select>
            <Badge className="bg-emerald-600 text-white">{successCount} sukses</Badge>
            <Badge className="bg-rose-600 text-white">{failedCount} gagal</Badge>
          </div>
        </div>
        <div className="px-4 pb-4">
          <p className="text-sm text-slate-600">
            Menampilkan log login terbaru dari tabel <code>audit_logs</code> untuk modul auth.
          </p>
        </div>
      </Card>

      {error ? (
        <Card className="border-amber-200 bg-amber-50/85 p-4">
          <p className="text-sm font-semibold text-amber-900">{error}</p>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Waktu</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Identifier</th>
                <th className="px-4 py-3 font-semibold">User ID</th>
                <th className="px-4 py-3 font-semibold">Pesan</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500 text-center" colSpan={5}>
                    Belum ada data audit login.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge className={row.aksi === "LOGIN_SUCCESS" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}>
                        {row.aksi === "LOGIN_SUCCESS" ? "Sukses" : "Gagal"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.new_data?.identifier ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{row.id_user ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{row.new_data?.message ?? "-"}</td>
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
