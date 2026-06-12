"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Webhook, Info } from "lucide-react";
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

export function WebhookLogsView({ rows, error }: { rows: any[], error: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentProvider = searchParams.get('provider') || 'all';

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("provider", value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Webhook className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Log Server</p>
              <h3 className="text-2xl font-bold text-slate-900">Webhook Events</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 border border-slate-100">
            <Info className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600">Total {rows.length} log terbaru</span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4">
          <Select value={currentProvider} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Semua Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Provider</SelectItem>
              <SelectItem value="midtrans">Midtrans</SelectItem>
              <SelectItem value="xendit">Xendit</SelectItem>
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
                <th className="px-6 py-4 font-semibold text-slate-700">Waktu</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Provider</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Event Type / Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Event ID / Order ID</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Payload Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-slate-500" colSpan={5}>
                    Belum ada webhook event yang tercatat.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{formatDate(row.created_at)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">{row.provider}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold text-slate-700 bg-slate-50 px-2 py-1 inline-block rounded border border-slate-100">
                        {row.event_type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600 font-mono text-xs">
                        {row.event_id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs transition-colors"
                        onClick={() => alert(JSON.stringify(row.payload, null, 2))}
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
