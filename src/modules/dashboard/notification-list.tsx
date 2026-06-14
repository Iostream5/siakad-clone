"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatNotificationDate } from "@/lib/utils/date-formatter";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/actions/notifications";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NotificationList({ user, initialData }: { user: any, initialData: any[] }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold text-slate-800">Daftar Pemberitahuan</CardTitle>
        <form action={markAllNotificationsReadAction}>
          <input type="hidden" name="redirectTo" value="/dashboard/notifikasi" />
          <Button type="submit" variant="outline" size="sm" className="h-8 text-xs font-bold text-slate-600 bg-white">
            Tandai Semua Dibaca
          </Button>
        </form>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {initialData.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-slate-500">Belum ada notifikasi.</p>
              <p className="text-xs text-slate-400 mt-1">Anda sudah membaca semua pemberitahuan.</p>
            </div>
          ) : (
            initialData.map((item) => (
              <div
                key={item.id}
                className={`flex gap-4 p-5 transition-colors hover:bg-slate-50 ${item.is_read ? "" : "bg-cyan-50/30"}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    {!item.is_read ? <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-500 shadow-sm" /> : null}
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${item.is_read ? "text-slate-700" : "text-slate-900"}`}>{item.judul}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.pesan}</p>
                      <p className="mt-2 text-[10px] font-bold uppercase text-slate-400">{formatNotificationDate(item.created_at)}</p>
                    </div>
                  </div>
                </div>
                {!item.is_read ? (
                  <form action={markNotificationReadAction} className="shrink-0 self-center">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="redirectTo" value="/dashboard/notifikasi" />
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 shadow-sm"
                    >
                      Tandai Dibaca
                    </button>
                  </form>
                ) : null}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
