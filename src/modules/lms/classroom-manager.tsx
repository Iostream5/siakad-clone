"use client";

import { useState } from "react";
import type { ReactNode, SVGProps } from "react";
import { 
  FileText, 
  Layout, 
  MessageSquare, 
  Users, 
  ArrowLeft,
  Calendar,
  MapPin,
  Download,
  Plus,
  Paperclip,
  GraduationCap,
  Pencil
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AddMateriModal } from "./modals/add-materi-modal";
import { AddTugasModal } from "./modals/add-tugas-modal";
import { AddForumModal } from "./modals/add-forum-modal";
import { DetailMateriModal } from "./modals/detail-materi-modal";
import type { LmsParticipant } from "@/lib/admin/lms";

interface ClassroomManagerProps {
  user: { role: string };
  jadwal: LmsJadwal;
  initialMateri: LmsMateri[];
  initialTugas: LmsTugas[];
  initialForum: LmsForumTopik[];
  participants: LmsParticipant[];
  canManage: boolean;
}

type LmsJadwal = {
  id: string;
  nama_kelas: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string;
  mata_kuliah: { nama: string; kode: string; sks: number } | null;
  dosen: { users: { full_name: string } | null } | null;
};

type LmsMateri = {
  id: string;
  judul: string;
  deskripsi?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  is_visible: boolean;
  created_at: string;
};

type LmsTugas = {
  id: string;
  judul: string;
  instruksi?: string | null;
  deadline: string;
  poin_max: number;
};

type LmsForumTopik = {
  id: string;
  judul: string;
  konten: string;
  is_pinned: boolean;
  created_at: string;
  users?: { full_name: string; role: string } | null;
  lms_forum_komentar?: Array<{ count: number }>;
};

export function ClassroomManager({ 
  user, 
  jadwal, 
  initialMateri, 
  initialTugas, 
  initialForum,
  participants,
  canManage,
}: ClassroomManagerProps) {
  const [activeTab, setActiveTab] = useState("materi");
  const [isMateriModalOpen, setIsMateriModalOpen] = useState(false);
  const [isTugasModalOpen, setIsTugasModalOpen] = useState(false);
  const [isForumModalOpen, setIsForumModalOpen] = useState(false);
  const [editingMateri, setEditingMateri] = useState<LmsMateri | null>(null);
  const [viewingMateri, setViewingMateri] = useState<LmsMateri | null>(null);
  
  const canCreateForum = user.role === "Admin" || user.role === "Dosen" || user.role === "Mahasiswa";
  const showAddButton = activeTab === "forum" ? canCreateForum : canManage;

  function handleAddClick() {
    if (activeTab === "materi") {
      setEditingMateri(null);
      setViewingMateri(null);
      setIsMateriModalOpen(true);
    } else if (activeTab === "tugas") {
      setIsTugasModalOpen(true);
    } else if (activeTab === "forum") {
      setIsForumModalOpen(true);
    }
  }

  function handleEditMateri(item: LmsMateri) {
    setEditingMateri(item);
    setIsMateriModalOpen(true);
  }

  function handleViewMateri(item: LmsMateri) {
    setViewingMateri(item);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/akademik/lms">
          <Button variant="ghost" className="text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-white/50">
            <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Dashboard
          </Button>
        </Link>
        <div className="flex gap-2">
           <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[10px] uppercase tracking-wider px-3">
             Semester Ganjil 2026
           </Badge>
           <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-black text-[10px] uppercase tracking-wider px-3">
             Kelas {jadwal.nama_kelas}
           </Badge>
        </div>
      </div>

      {/* Classroom Banner */}
      <Card className="overflow-hidden border-slate-200 shadow-xl rounded-[2rem]">
        <div className="relative">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.9),rgba(5,150,105,0.95))] mix-blend-multiply" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
          
          <div className="relative p-10 md:p-14 text-white">
            <div className="max-w-3xl">
              <p className="text-emerald-200 font-black uppercase tracking-[0.3em] text-[10px] mb-3">Virtual Classroom</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-6">
                {jadwal.mata_kuliah?.nama}
              </h1>
              
              <div className="flex flex-wrap gap-6 mt-8">
                <InfoItem icon={<User className="h-4 w-4" />} label="Dosen Pengampu" value={jadwal.dosen?.users?.full_name} />
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Jadwal" value={`${jadwal.hari}, ${jadwal.jam_mulai} - ${jadwal.jam_selesai}`} />
                <InfoItem icon={<MapPin className="h-4 w-4" />} label="Ruangan" value={jadwal.ruangan} />
                <InfoItem icon={<GraduationCap className="h-4 w-4" />} label="SKS" value={`${jadwal.mata_kuliah?.sks} SKS`} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="materi" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 p-2 rounded-[1.5rem] border border-slate-200/60 backdrop-blur-sm sticky top-20 z-20">
          <TabsList className="bg-transparent h-auto p-0 gap-1">
            <TabTrigger value="materi" icon={<FileText className="h-4 w-4" />} label="Materi Kuliah" />
            <TabTrigger value="tugas" icon={<Layout className="h-4 w-4" />} label="Tugas & Kuis" />
            <TabTrigger value="forum" icon={<MessageSquare className="h-4 w-4" />} label="Forum Diskusi" />
            <TabTrigger value="peserta" icon={<Users className="h-4 w-4" />} label="Peserta Kelas" />
          </TabsList>
          
          {showAddButton && (
            <div className="px-2">
              <Button 
                onClick={handleAddClick}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4 mr-2" /> Tambah {activeTab === 'materi' ? 'Materi' : activeTab === 'tugas' ? 'Tugas' : 'Topik Diskusi'}
              </Button>
            </div>
          )}
        </div>

        <div className="mt-8">
          <TabsContent value="materi" className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-4">
              {initialMateri.length === 0 ? (
                <EmptyState icon={<FileText />} message="Belum ada materi kuliah yang diunggah." />
              ) : (
                initialMateri.map((item) => (
                  <MateriCard key={item.id} item={item} onEdit={handleEditMateri} onView={handleViewMateri} userRole={user.role} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="tugas" className="animate-in slide-in-from-bottom-4 duration-500">
             <div className="grid gap-4">
              {initialTugas.length === 0 ? (
                <EmptyState icon={<Layout />} message="Belum ada tugas atau kuis untuk kelas ini." />
              ) : (
                initialTugas.map((item) => (
                  <TugasCard key={item.id} item={item} jadwalId={jadwal.id} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="forum" className="animate-in slide-in-from-bottom-4 duration-500">
             <div className="grid gap-6">
              {initialForum.length === 0 ? (
                <EmptyState icon={<MessageSquare />} message="Belum ada diskusi di kelas ini. Jadilah yang pertama memulai!" />
              ) : (
                initialForum.map((item) => (
                  <ForumCard key={item.id} item={item} jadwalId={jadwal.id} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="peserta" className="animate-in slide-in-from-bottom-4 duration-500">
            {participants.length === 0 ? (
              <EmptyState icon={<Users />} message="Belum ada peserta dari KRS yang disetujui." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {participants.map((participant) => (
                  <Card key={participant.id} className="p-5 border-slate-200 shadow-sm rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{participant.full_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {participant.nim ?? "NIM belum ada"} {participant.prodi_name ? `- ${participant.prodi_name}` : ""}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      <AddMateriModal 
        isOpen={isMateriModalOpen} 
        onClose={() => { setIsMateriModalOpen(false); setEditingMateri(null); }} 
        jadwalId={jadwal.id} 
        editItem={editingMateri}
      />
      
      <DetailMateriModal
        isOpen={viewingMateri !== null}
        onClose={() => setViewingMateri(null)}
        item={viewingMateri}
      />

      <AddTugasModal 
        isOpen={isTugasModalOpen} 
        onClose={() => setIsTugasModalOpen(false)} 
        jadwalId={jadwal.id} 
      />

      <AddForumModal 
        isOpen={isForumModalOpen} 
        onClose={() => setIsForumModalOpen(false)} 
        jadwalId={jadwal.id} 
        canPin={canManage}
      />
    </div>
  );
}

// Helper Components
function InfoItem({ icon, label, value }: { icon: ReactNode, label: string, value: string | undefined }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-200/70">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function TabTrigger({ value, icon, label }: { value: string, icon: ReactNode, label: string }) {
  return (
    <TabsTrigger 
      value={value} 
      className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-xl px-6 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-300"
    >
      <span className="mr-2">{icon}</span> {label}
    </TabsTrigger>
  );
}

function MateriCard({ item, onEdit, onView, userRole }: { item: LmsMateri, onEdit: (item: LmsMateri) => void, onView: (item: LmsMateri) => void, userRole: string }) {
  const canEdit = userRole === "Dosen";
  return (
    <Card 
      className="p-5 border-slate-200 shadow-sm hover:border-emerald-200 transition-all rounded-2xl group cursor-pointer"
      onClick={() => onView(item)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors border border-slate-100">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h5 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{item.judul}</h5>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Diunggah pada {new Date(item.created_at).toLocaleDateString('id-ID')}</span>
              <Badge variant="outline" className="text-[9px] font-black uppercase h-5 px-1.5 border-slate-200 text-slate-400">{item.file_type || 'PDF'}</Badge>
              {!item.is_visible && (
                <Badge className="text-[9px] font-black uppercase h-5 px-1.5 bg-amber-50 text-amber-700 border-amber-100">Hidden</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="flex items-center justify-center h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Edit Materi"
            >
              <Pencil className="h-5 w-5" />
            </button>
          )}
          {item.file_url && (
            <a href={item.file_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center justify-center h-10 w-10 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
              <Download className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

function TugasCard({ item, jadwalId }: { item: LmsTugas, jadwalId: string }) {
  const isExpired = new Date(item.deadline) < new Date();
  
  return (
    <Link href={`/dashboard/akademik/lms/${jadwalId}/tugas/${item.id}`}>
      <Card className="p-6 border-slate-200 shadow-sm hover:border-indigo-200 transition-all rounded-2xl group cursor-pointer">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
               <Badge className={cn(
                 "font-black text-[9px] uppercase tracking-widest px-2",
                 isExpired ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
               )}>
                 {isExpired ? 'Deadline Terlewati' : 'Sedang Berjalan'}
               </Badge>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 Deadline: {new Date(item.deadline).toLocaleString('id-ID')}
               </span>
            </div>
            <h5 className="text-base font-black text-slate-900 leading-tight mb-2 uppercase group-hover:text-indigo-600 transition-colors">{item.judul}</h5>
            <p className="text-sm text-slate-500 font-medium line-clamp-2">{item.instruksi || 'Tidak ada instruksi tambahan.'}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right mr-4 hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bobot Nilai</p>
              <p className="text-lg font-black text-slate-900">{item.poin_max} Poin</p>
            </div>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-xl shadow-lg shadow-slate-200">
              Buka Tugas
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function ForumCard({ item, jadwalId }: { item: LmsForumTopik, jadwalId: string }) {
  return (
    <Link href={`/dashboard/akademik/lms/${jadwalId}/forum/${item.id}`}>
      <Card className="p-6 border-slate-200 shadow-sm hover:border-indigo-200 transition-all rounded-2xl group cursor-pointer">
        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
            <User className="h-6 w-6 text-indigo-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{item.judul}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                  Oleh <span className="text-indigo-600">{item.users?.full_name}</span> ({item.users?.role}) • {new Date(item.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
              {item.is_pinned && <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-black text-[9px] uppercase tracking-widest px-2">Pinned</Badge>}
            </div>
            <p className="text-sm text-slate-600 font-medium line-clamp-3 mb-4">{item.konten}</p>
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                <MessageSquare className="h-3.5 w-3.5" /> {item.lms_forum_komentar?.[0]?.count || 0} Komentar
              </button>
              <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-emerald-600 transition-colors">
                <Paperclip className="h-3.5 w-3.5" /> 0 Lampiran
              </button>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function EmptyState({ icon, message }: { icon: ReactNode, message: string }) {
  return (
    <div className="p-20 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-200 bg-white/50 rounded-[2rem] animate-in fade-in duration-1000">
      <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-6 border border-slate-100">
        {icon}
      </div>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{message}</p>
    </div>
  );
}

function User(props: SVGProps<SVGSVGElement>) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
