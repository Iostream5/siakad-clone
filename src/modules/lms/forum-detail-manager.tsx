"use client";

import { useState, useTransition } from "react";
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  User, 
  MoreVertical,
  Pin,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { createLmsForumKomentarAction } from "@/actions/lms";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";

interface ForumDetailManagerProps {
  user: any;
  topik: any;
  initialKomentar: any[];
}

export function ForumDetailManager({ user, topik, initialKomentar }: ForumDetailManagerProps) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();
  const router = useRouter();
  const [newComment, setNewComment] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    const formData = new FormData();
    formData.append("topikId", topik.id);
    formData.append("konten", newComment);

    startTransition(async () => {
      const result = await createLmsForumKomentarAction(formData);
      if (result.success) {
        success("Komentar terkirim");
        setNewComment("");
        router.refresh();
      } else {
        error(result.error || "Gagal mengirim komentar");
      }
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/akademik/lms/${topik.jadwal_id}`}>
          <Button variant="ghost" className="text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-white/50">
            <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Forum
          </Button>
        </Link>
        <div className="flex gap-2">
           {topik.is_pinned && <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-black text-[9px] uppercase tracking-widest px-2">Pinned</Badge>}
           <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-[9px] uppercase tracking-widest px-2">Diskusi Kelas</Badge>
        </div>
      </div>

      {/* Main Topic Card */}
      <Card className="border-slate-200 shadow-xl rounded-[2rem] overflow-hidden bg-white">
        <div className="p-8">
          <div className="flex gap-5">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
              <UserIcon className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">{topik.judul}</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                    Oleh <span className="text-indigo-600 font-black">{topik.users?.full_name}</span> ({topik.users?.role}) • {new Date(topik.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
                <Button variant="ghost" className="h-10 w-10 p-0 text-slate-400 rounded-xl">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{topik.konten}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-6">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
             <MessageSquare className="h-3.5 w-3.5 text-indigo-400" /> {initialKomentar.length} Tanggapan
           </div>
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
             <Clock className="h-3.5 w-3.5 text-emerald-400" /> Aktif 
           </div>
        </div>
      </Card>

      {/* Comments Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-4">Tanggapan Diskusi</h3>
        
        {initialKomentar.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Belum ada tanggapan.</p>
          </div>
        ) : (
          initialKomentar.map((item) => (
            <Card key={item.id} className="p-6 border-slate-200 shadow-sm rounded-2xl bg-white/60 backdrop-blur-sm ml-4 border-l-4 border-l-indigo-200">
               <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                       <p className="text-[11px] font-black text-slate-900 uppercase">
                         {item.users?.full_name} <span className="text-slate-300 mx-1">•</span> <span className="text-slate-400 font-bold tracking-tighter">{new Date(item.created_at).toLocaleString('id-ID')}</span>
                       </p>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.konten}</p>
                  </div>
               </div>
            </Card>
          ))
        )}
      </div>

      {/* Reply Box */}
      <div className="sticky bottom-8 z-30">
        <Card className="p-4 border-slate-200 shadow-2xl rounded-3xl bg-white/90 backdrop-blur-md border-t-4 border-t-indigo-500">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div className="flex-1">
              <Textarea 
                placeholder="Tulis tanggapan Anda..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="rounded-2xl border-none bg-slate-50 focus:ring-0 font-medium min-h-[60px] resize-none py-3"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isPending || !newComment.trim()}
              className="h-12 w-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 transition-all active:scale-90"
            >
              {isPending ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function UserIcon(props: any) {
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
