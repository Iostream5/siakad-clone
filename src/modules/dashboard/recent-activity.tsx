import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getActivityLogs } from "@/lib/admin/activity-audit";
import { History, User, Database, ArrowRight } from "lucide-react";
import Link from "next/link";

function formatDateShort(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function RecentActivityFeed() {
  const { rows, error } = await getActivityLogs(10);

  if (error) return null;

  return (
    <Card className="h-full border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Feed</p>
          <h3 className="text-lg font-bold text-slate-900">Aktivitas Terbaru</h3>
        </div>
        <Link 
          href="/dashboard/pengaturan/audit-aktivitas"
          className="group flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Lihat Semua
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="space-y-5">
        {rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400 italic">Belum ada aktivitas tercatat.</div>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="relative pl-7 before:absolute before:left-2 before:top-2 before:bottom-[-20px] before:w-[1px] before:bg-slate-100 last:before:hidden">
              <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-white bg-indigo-500 shadow-sm z-10" />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">{row.user_full_name}</span>
                    <Badge className="text-[9px] px-1 py-0 h-4 uppercase font-bold bg-slate-100 text-slate-500 border-none">
                      {row.aksi}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-1">
                    {row.aksi === "UPDATE" ? "Memperbarui" : row.aksi === "CREATE" ? "Menambahkan" : "Menghapus"} data di modul <span className="font-semibold">{row.modul}</span>
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      {row.table_name}
                    </span>
                    <span>{formatDateShort(row.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
