"use client";

import dynamic from "next/dynamic";
import { BarChart3, BookMarked, UserRoundCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { dashboardMetrics } from "@/lib/constants";
import type { SessionUser } from "@/types/domain";
import type { AnnouncementRow } from "@/lib/admin/announcements";

const GrowthChart = dynamic(() => import("./growth-chart"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse bg-slate-50 rounded-xl border border-slate-100" />
});

export function DashboardOverview({ 
  user, 
  announcements = [],
  stats,
  activityFeed
}: { 
  user: SessionUser, 
  announcements?: AnnouncementRow[],
  stats?: {
    users: number;
    fakultas: number;
    programStudi: number;
    mataKuliah: number;
    dosen: number;
    mahasiswa: number;
    ruangan: number;
    tahunAkademik: number;
  },
  activityFeed?: React.ReactNode
}) {
  // Override metrics with real data for Admin
  const metrics = [...dashboardMetrics[user.role]];
  
  if (user.role === "Admin" && stats) {
    metrics[0] = { ...metrics[0], value: stats.mahasiswa.toLocaleString('id-ID') };
    metrics[2] = { label: "Total Dosen", value: stats.dosen.toLocaleString('id-ID'), change: "Aktif" };
  }

  const highlightCardsAdmin = [
    {
      title: "Data Master",
      value: `${stats?.programStudi || 0} Prodi`,
      icon: BookMarked,
      description: `Terdapat ${stats?.fakultas || 0} Fakultas dan ${stats?.mataKuliah || 0} Mata Kuliah.`,
    },
    {
      title: "Infrastruktur",
      value: `${stats?.ruangan || 0} Ruang`,
      icon: UserRoundCheck,
      description: "Gedung dan ruangan kelas untuk perkuliahan.",
    },
    {
      title: "Tahun Akademik",
      value: stats?.tahunAkademik || 0,
      icon: BarChart3,
      description: "Riwayat dan tahun akademik yang terdaftar.",
    },
    {
      title: "Pengguna",
      value: stats?.users || 0,
      icon: UserRoundCheck,
      description: "Total akun pengguna yang terdaftar di sistem.",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-slate-200/60 shadow-sm">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{metric.label}</p>
            <div className="mt-4 flex items-end justify-between">
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{metric.value}</h3>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 px-2 py-0.5">{metric.change}</Badge>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-slate-200/60 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Analytics Snapshot</p>
                <h3 className="text-lg font-bold text-slate-900">Pertumbuhan Mahasiswa</h3>
              </div>
              <Badge variant="outline" className="text-slate-500 border-slate-200">2026 Trend</Badge>
            </div>
            <GrowthChart />
          </Card>

          {user.role === "Admin" && (
            <div className="grid gap-4 md:grid-cols-2">
              {highlightCardsAdmin.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="bg-white border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-indigo-600 border border-slate-100">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                        <p className="text-2xl font-bold text-indigo-600">{item.value}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-500 font-medium">{item.description}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          {user.role === "Admin" ? (
            activityFeed
          ) : (
            <Card className="h-full">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-sm text-slate-500">Pengumuman & Notifikasi</p>
                 <Badge variant="outline">{announcements.length} Baru</Badge>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {announcements.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-500 italic">Belum ada pengumuman hari ini.</div>
                ) : announcements.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-slate-50 p-4 border border-slate-100 hover:border-indigo-200 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-bold text-slate-900 leading-tight text-sm">{item.judul}</h4>
                        <span className="shrink-0 text-[10px] text-slate-400 font-bold uppercase">{new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-3">{item.isi}</p>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </aside>
      </section>
    </div>
  );
}
