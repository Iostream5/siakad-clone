import { Activity, Clock3, Database, ListChecks, ServerCog, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDeveloperToolSnapshot, type QueueJobRow } from "@/lib/admin/phase1-admin";
import { requireAuthorizedUser } from "@/lib/auth";

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function queueStatusVariant(status: QueueJobRow["status"]) {
  if (status === "completed") return "success";
  if (status === "failed") return "destructive";
  if (status === "active") return "default";
  return "secondary";
}

export default async function DeveloperToolsPage() {
  await requireAuthorizedUser("pengaturan.developer-tools", ["Admin"]);
  const snapshot = await getDeveloperToolSnapshot();
  const errors = [snapshot.apiLogs.error, snapshot.queueJobs.error, snapshot.scheduledJobs.error].filter(Boolean);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Developer Tools</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">API Logs, Queue, Scheduler</h2>
              <p className="mt-1 text-sm text-slate-600">
                Struktur awal untuk observability, background jobs, dan scheduler yang diminta prompt aplikasi.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-lg font-bold text-slate-950">{snapshot.apiLogs.rows.length}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">API Log</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-lg font-bold text-blue-800">{snapshot.queueJobs.rows.length}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Queue</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3">
              <p className="text-lg font-bold text-violet-800">{snapshot.scheduledJobs.rows.length}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">Scheduler</p>
            </div>
          </div>
        </div>
      </Card>

      {errors.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-5 w-5 text-amber-700" />
            <div>
              <p className="font-semibold text-amber-950">Sebagian data memakai fallback</p>
              <div className="mt-1 space-y-1 text-sm text-amber-800">
                {errors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Request Monitoring</p>
                <h3 className="text-xl font-semibold text-slate-950">API Logs</h3>
              </div>
            </div>
            <Badge variant={snapshot.apiLogs.source === "database" ? "success" : "secondary"}>
              {snapshot.apiLogs.source === "database" ? "Database" : "Fallback"}
            </Badge>
          </div>

          <div className="mt-4 overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Endpoint</TH>
                  <TH>Status</TH>
                  <TH>Durasi</TH>
                  <TH>Waktu</TH>
                </TR>
              </THead>
              <TBody>
                {snapshot.apiLogs.rows.map((row) => (
                  <TR key={row.id}>
                    <TD>
                      <p className="font-mono text-xs font-semibold text-slate-950">{row.method}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">{row.path}</p>
                    </TD>
                    <TD>
                      <Badge variant={row.status_code >= 400 ? "destructive" : "success"}>{row.status_code}</Badge>
                    </TD>
                    <TD className="text-sm text-slate-600">{row.duration_ms ? `${row.duration_ms} ms` : "-"}</TD>
                    <TD className="text-sm text-slate-500">{formatDate(row.created_at)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <ListChecks className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Background Jobs</p>
                <h3 className="text-xl font-semibold text-slate-950">Queue Jobs</h3>
              </div>
            </div>
            <Badge variant={snapshot.queueJobs.source === "database" ? "success" : "secondary"}>
              {snapshot.queueJobs.source === "database" ? "Database" : "Fallback"}
            </Badge>
          </div>

          <div className="mt-4 space-y-3">
            {snapshot.queueJobs.rows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{row.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{row.queue}</p>
                  </div>
                  <Badge variant={queueStatusVariant(row.status)}>{row.status}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                  <span>Attempts: {row.attempts}</span>
                  <span>Run: {formatDate(row.run_at)}</span>
                  <span>Done: {formatDate(row.finished_at)}</span>
                </div>
                {row.last_error ? <p className="mt-2 text-xs text-rose-700">{row.last_error}</p> : null}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Cron Readiness</p>
              <h3 className="text-xl font-semibold text-slate-950">Scheduled Jobs</h3>
            </div>
          </div>
          <Badge variant={snapshot.scheduledJobs.source === "database" ? "success" : "secondary"}>
            {snapshot.scheduledJobs.source === "database" ? "Database" : "Fallback"}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.scheduledJobs.rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{row.name}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">{row.handler}</p>
                </div>
                <Badge variant={row.is_active ? "success" : "secondary"}>{row.is_active ? "Aktif" : "Draft"}</Badge>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <ServerCog className="h-4 w-4 text-slate-500" />
                <span className="font-mono">{row.cron}</span>
              </div>
              <div className="mt-3 grid gap-1 text-xs text-slate-500">
                <span>Last run: {formatDate(row.last_run_at)}</span>
                <span>Next run: {formatDate(row.next_run_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
