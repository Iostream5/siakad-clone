import { Bell, Database, MessageSquareText, RadioTower } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getNotificationTemplates, type NotificationTemplateRow } from "@/lib/admin/phase1-admin";
import { requireAuthorizedUser } from "@/lib/auth";

function channelLabel(channel: NotificationTemplateRow["channel"]) {
  const labels: Record<NotificationTemplateRow["channel"], string> = {
    in_app: "In-App",
    email: "Email",
    whatsapp: "WhatsApp",
    push: "Push",
  };

  return labels[channel];
}

function channelVariant(channel: NotificationTemplateRow["channel"]) {
  if (channel === "push") return "default";
  if (channel === "email") return "outline";
  if (channel === "whatsapp") return "success";
  return "secondary";
}

export default async function NotificationTemplatesPage() {
  await requireAuthorizedUser("pengaturan.template-notifikasi", ["Admin"]);
  const templates = await getNotificationTemplates();
  const activeCount = templates.rows.filter((row) => row.is_active).length;
  const triggerCount = new Set(templates.rows.map((row) => row.trigger_event)).size;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Notification System</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">Template Notifikasi</h2>
              <p className="mt-1 text-sm text-slate-600">
                Template awal untuk event billing, payment, jadwal, nilai, KRS, dan pengumuman.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-lg font-bold text-slate-950">{templates.rows.length}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Template</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-lg font-bold text-emerald-800">{activeCount}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Aktif</p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
              <p className="text-lg font-bold text-sky-800">{triggerCount}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">Event</p>
            </div>
          </div>
        </div>
      </Card>

      {templates.error ? (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-5 w-5 text-amber-700" />
            <div>
              <p className="font-semibold text-amber-950">Menggunakan fallback template</p>
              <p className="mt-1 text-sm text-amber-800">{templates.error}</p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-sm text-slate-500">Template Registry</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">Event notifikasi operasional</h3>
          </div>
          <Badge variant={templates.source === "database" ? "success" : "secondary"}>
            {templates.source === "database" ? "Database" : "Fallback"}
          </Badge>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Template</TH>
                <TH>Channel</TH>
                <TH>Subject</TH>
                <TH>Variabel</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {templates.rows.map((row) => (
                <TR key={row.id}>
                  <TD className="min-w-[220px]">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        {row.channel === "push" ? <RadioTower className="h-4 w-4" /> : <MessageSquareText className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{row.name}</p>
                        <p className="mt-1 font-mono text-xs text-slate-500">{row.trigger_event}</p>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <Badge variant={channelVariant(row.channel)}>{channelLabel(row.channel)}</Badge>
                  </TD>
                  <TD className="max-w-sm">
                    <p className="font-medium text-slate-900">{row.subject}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{row.body}</p>
                  </TD>
                  <TD className="max-w-xs">
                    <div className="flex flex-wrap gap-1.5">
                      {row.variables.length === 0 ? (
                        <span className="text-sm text-slate-400">-</span>
                      ) : (
                        row.variables.map((variable) => (
                          <span key={variable} className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700">
                            {variable}
                          </span>
                        ))
                      )}
                    </div>
                  </TD>
                  <TD>
                    <Badge variant={row.is_active ? "success" : "secondary"}>{row.is_active ? "Aktif" : "Draft"}</Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
