"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  GraduationCap, 
  Layout, 
  Search, 
  User,
  ArrowRight,
  MoreVertical,
  FileText,
  MessageSquare,
  CheckCircle2,
  Settings
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface LmsDashboardProps {
  role: string;
  initialClasses: any[];
  stats?: { totalMateri: number, totalTugas: number, totalForum: number } | null;
}

export function LmsDashboard({ role, initialClasses, stats }: LmsDashboardProps) {
  const [search, setSearch] = useState("");

  const filteredClasses = initialClasses.filter((c) => 
    c.mata_kuliah?.nama?.toLowerCase().includes(search.toLowerCase()) ||
    c.mata_kuliah?.kode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header Card */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 backdrop-blur-sm border border-emerald-500/30">
                <SchoolIcon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/80">Enterprise LMS</p>
                <h2 className="text-3xl font-black tracking-tight">E-Learning & Virtual Classroom</h2>
                <p className="mt-1 text-slate-400 text-sm font-medium">Selamat datang di pusat pembelajaran digital STAI.</p>
              </div>
            </div>
            
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <Input 
                placeholder="Cari Mata Kuliah..." 
                className="pl-12 h-14 bg-white/10 border-white/10 text-white placeholder:text-slate-500 rounded-2xl focus:bg-white/15 focus:border-emerald-500/50 transition-all font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 bg-emerald-600 rounded-full" />
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">
              {role === "Admin" || role === "Prodi" ? "Monitoring Kelas" : "Kelas Aktif Anda"}
          </h3>
        </div>
        <Badge className="bg-slate-100 text-slate-600 border-slate-200 px-3 py-1 font-bold text-[10px] uppercase tracking-wider rounded-lg">
          Total {filteredClasses.length} Mata Kuliah
        </Badge>
      </div>

      {filteredClasses.length === 0 ? (
        <Card className="p-20 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-[2rem]">
          <div className="h-20 w-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
            <BookOpen className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Belum ada kelas aktif</h3>
          <p className="text-slate-500 max-w-xs mx-auto">
             {role === "Admin" || role === "Prodi" ? "Belum ada kelas yang dibuat untuk semester ini." : "Anda belum terdaftar di kelas manapun untuk semester ini."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((item) => (
            <Link key={item.id} href={`/dashboard/akademik/lms/${item.id}`} className="group">
              <Card className="h-full overflow-hidden border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group-hover:-translate-y-1 rounded-[1.5rem] flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[10px] uppercase tracking-tighter rounded-lg px-2">
                      {item.mata_kuliah?.kode || "N/A"}
                    </Badge>
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <h4 className="text-lg font-black text-slate-900 mb-2 leading-tight group-hover:text-emerald-700 transition-colors">
                    {item.mata_kuliah?.nama || "Tanpa Nama"}
                  </h4>
                  
                  <div className="space-y-3 mt-6">
                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold">{item.dosen?.users?.full_name || "Dosen Pengampu"}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold uppercase">{item.hari}, {item.jam_mulai} - {item.jam_selesai}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Clock className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold uppercase">Ruang {item.ruangan} / Kelas {item.nama_kelas}</span>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  {(role === "Admin" || role === "Prodi") ? (
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                         <span title="Materi" className="flex items-center gap-1"><FileText className="h-3 w-3" /> {item.materi?.[0]?.count || 0}</span>
                         <span title="Tugas" className="flex items-center gap-1"><Layout className="h-3 w-3" /> {item.tugas?.[0]?.count || 0}</span>
                         <span title="Peserta" className="flex items-center gap-1"><User className="h-3 w-3" /> {item.peserta || 0}</span>
                      </div>
                  ) : (
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                            M{i}
                          </div>
                        ))}
                        <div className="h-6 w-6 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-[8px] font-bold text-white">
                          +12
                        </div>
                      </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-black uppercase tracking-widest">
                    {(role === "Admin" || role === "Prodi") ? "Pantau Kelas" : "Buka Kelas"} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Stats / Info Footer */}
      {(role === "Admin" || role === "Prodi") && stats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              icon={<SchoolIcon className="h-5 w-5 text-indigo-600" />}
              label="Total Kelas Aktif"
              value={`${filteredClasses.length} Kelas`}
              bg="bg-indigo-50"
            />
            <StatCard
              icon={<FileText className="h-5 w-5 text-blue-600" />}
              label="Total Materi"
              value={`${stats.totalMateri} File`}
              bg="bg-blue-50"
            />
            <StatCard
              icon={<Layout className="h-5 w-5 text-amber-600" />}
              label="Total Tugas"
              value={`${stats.totalTugas} Tugas`}
              bg="bg-amber-50"
            />
            <StatCard
              icon={<MessageSquare className="h-5 w-5 text-purple-600" />}
              label="Total Topik Diskusi"
              value={`${stats.totalForum} Topik`}
              bg="bg-purple-50"
            />
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              icon={<FileText className="h-5 w-5 text-blue-600" />}
              label="Materi Terbaru"
              value="12 File"
              bg="bg-blue-50"
            />
            <StatCard
              icon={<MessageSquare className="h-5 w-5 text-purple-600" />}
              label="Diskusi Aktif"
              value="5 Topik"
              bg="bg-purple-50"
            />
            <StatCard
              icon={<Layout className="h-5 w-5 text-amber-600" />}
              label="Tugas Mendatang"
              value="3 Tugas"
              bg="bg-amber-50"
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              label="Kehadiran"
              value="95%"
              bg="bg-emerald-50"
            />
          </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode, label: string, value: string, bg: string }) {
  return (
    <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-4 rounded-2xl">
      <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-black text-slate-900">{value}</p>
      </div>
    </Card>
  );
}

function SchoolIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 6 8-4 8 4" />
      <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2" />
      <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
      <path d="M18 5v17" />
      <path d="M6 5v17" />
      <circle cx="12" cy="9" r="2" />
    </svg>
  );
}
