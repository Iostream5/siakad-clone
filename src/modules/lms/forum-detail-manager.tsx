"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import type { SVGProps } from "react";
import { 
  ArrowLeft, 
  Send, 
  MoreVertical,
  Pencil,
  Trash2,
  Pin
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createLmsForumKomentarAction, deleteLmsForumKomentarAction, updateLmsForumKomentarAction, updateLmsForumTopikAction, deleteLmsForumTopikAction } from "@/actions/lms";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";

interface ForumDetailManagerProps {
  user: { id: string; role: string };
  topik: LmsForumTopikDetail;
  initialKomentar: LmsForumKomentar[];
}

type LmsForumTopikDetail = {
  id: string;
  jadwal_id: string;
  judul: string;
  konten: string;
  is_pinned: boolean;
  created_at: string;
  file_url?: string | null;
  users?: { full_name: string; role: string } | null;
};

type LmsForumKomentar = {
  id: string;
  konten: string;
  created_at: string;
  file_url?: string | null;
  user_id?: string;
  users?: { full_name: string; role: string } | null;
};

export function ForumDetailManager({ user, topik, initialKomentar }: ForumDetailManagerProps) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();
  const router = useRouter();
  const [newComment, setNewComment] = useState("");
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editedTitle, setEditedTitle] = useState(topik.judul);
  const [editedContent, setEditedContent] = useState(topik.konten);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");
  const [editedCommentFileUrl, setEditedCommentFileUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [editedTopicFileUrl, setEditedTopicFileUrl] = useState(topik.file_url || "");
  const [showFileUrlInput, setShowFileUrlInput] = useState(false);
  const canComment = user.role === "Admin" || user.role === "Dosen" || user.role === "Mahasiswa";
  const canEditTopic = user.role === "Dosen" || user.role === "Mahasiswa";

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on initial load
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialKomentar]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    const formData = new FormData();
    formData.append("topikId", topik.id);
    formData.append("konten", newComment);
    if (fileUrl) formData.append("fileUrl", fileUrl);

    startTransition(async () => {
      const result = await createLmsForumKomentarAction(formData);
      if (result.success) {
        success("Komentar terkirim");
        setNewComment("");
        setFileUrl("");
        setShowFileUrlInput(false);
        router.refresh();
      } else {
        error(result.error || "Gagal mengirim komentar");
      }
    });
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full bg-slate-50/80 animate-in fade-in duration-700 relative">
      
      {/* Chat Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 p-3 sm:p-4 px-4 sm:px-6 flex items-center justify-between z-20 sticky top-16 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href={`/dashboard/akademik/lms/${topik.jadwal_id}`}>
            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:bg-slate-100 rounded-full shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
              <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight line-clamp-1">{topik.judul}</h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest line-clamp-1">
                {topik.users?.full_name} • {initialKomentar.length} Tanggapan
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {topik.is_pinned && <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-black text-[9px] uppercase tracking-widest hidden sm:inline-flex"><Pin className="h-3 w-3 mr-1" /> Pinned</Badge>}
          {canEditTopic && !isEditingTopic && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-slate-600 rounded-full shrink-0">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-slate-200">
                <DropdownMenuItem onClick={() => setIsEditingTopic(true)} className="text-slate-700 cursor-pointer">
                  <Pencil className="h-4 w-4 mr-2" /> Edit Topik
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={async () => {
                    if (!confirm("Apakah Anda yakin ingin menghapus topik ini?")) return;
                    const formData = new FormData();
                    formData.append("topikId", topik.id);
                    formData.append("jadwalId", topik.jadwal_id);
                    startTransition(async () => {
                      const result = await deleteLmsForumTopikAction(formData);
                      if (result.success) {
                        success("Topik berhasil dihapus");
                        router.push(`/dashboard/akademik/lms/${topik.jadwal_id}`);
                      } else {
                        error(result.error || "Gagal menghapus topik");
                      }
                    });
                  }} 
                  className="text-rose-600 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Hapus Topik
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 sm:p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed pb-8">
        
        {/* Topic as Pinned/First Message */}
        <div className="flex justify-center mb-8 mt-2">
          <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 sm:p-6 max-w-3xl w-full shadow-sm">
            {isEditingTopic ? (
               <div className="space-y-3">
                 <input
                   type="text"
                   value={editedTitle}
                   onChange={(e) => setEditedTitle(e.target.value)}
                   className="w-full text-lg font-black text-slate-900 uppercase tracking-tight border-b-2 border-indigo-500 focus:outline-none pb-1 bg-transparent"
                   placeholder="Judul topik"
                 />
                 <textarea
                   value={editedContent}
                   onChange={(e) => setEditedContent(e.target.value)}
                   className="w-full text-slate-600 font-medium border-b-2 border-indigo-500 focus:outline-none pb-2 resize-none bg-transparent"
                   rows={3}
                   placeholder="Isi diskusi"
                 />
                 <input
                   type="url"
                   value={editedTopicFileUrl}
                   onChange={(e) => setEditedTopicFileUrl(e.target.value)}
                   className="w-full text-xs font-medium text-slate-600 border-b-2 border-slate-300 focus:border-indigo-500 focus:outline-none pb-1 bg-transparent"
                   placeholder="Lampiran URL (opsional)"
                 />
                 <div className="flex gap-2 pt-2 justify-end">
                   <Button
                     onClick={async () => {
                       const formData = new FormData();
                       formData.append("topikId", topik.id);
                       formData.append("jadwalId", topik.jadwal_id);
                       formData.append("judul", editedTitle);
                       formData.append("konten", editedContent);
                       if (editedTopicFileUrl) formData.append("fileUrl", editedTopicFileUrl);
                       startTransition(async () => {
                         const result = await updateLmsForumTopikAction(formData);
                         if (result.success) {
                           success("Topik berhasil diperbarui");
                           setIsEditingTopic(false);
                           router.refresh();
                         } else {
                           error(result.error || "Gagal memperbarui topik");
                         }
                       });
                     }}
                     disabled={isPending}
                     className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest h-8 px-4 rounded-lg"
                   >
                     Simpan
                   </Button>
                   <Button
                     onClick={() => {
                       setIsEditingTopic(false);
                       setEditedTitle(topik.judul);
                       setEditedContent(topik.konten);
                       setEditedTopicFileUrl(topik.file_url || "");
                     }}
                     variant="ghost"
                     className="font-bold text-[10px] uppercase tracking-widest h-8 px-4 rounded-lg"
                   >
                     Batal
                   </Button>
                 </div>
               </div>
            ) : (
               <>
                 <div className="flex items-center gap-2 mb-3 justify-center">
                    <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black text-[9px] uppercase tracking-widest px-2">Topik Diskusi</Badge>
                 </div>
                 <h2 className="text-base sm:text-lg font-black text-slate-900 text-center uppercase tracking-tight mb-2">{topik.judul}</h2>
                 <p className="text-slate-700 font-medium whitespace-pre-wrap text-center text-sm">{topik.konten}</p>
                 {topik.file_url && (
                   <div className="mt-4 flex justify-center">
                     <a href={topik.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors">
                       <Pin className="h-3.5 w-3.5" /> Lihat Lampiran
                     </a>
                   </div>
                 )}
                 <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                   <span>Oleh {topik.users?.full_name} ({topik.users?.role})</span>
                   <span>{new Date(topik.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                 </div>
               </>
            )}
          </div>
        </div>

        {/* Comments */}
        {initialKomentar.length === 0 ? (
          <div className="text-center py-8">
            <span className="bg-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-widest px-4 py-2 rounded-full inline-block">
              Belum ada tanggapan
            </span>
          </div>
        ) : (
          initialKomentar.map((item) => {
            const isMe = item.user_id === user.id;
            const isDeleted = item.konten.startsWith("[Komentar ini dihapus");
            const canDeleteComment = user.role === "Dosen" || (user.role === "Mahasiswa" && item.users?.full_name === topik.users?.full_name);

            return (
              <div key={item.id} className={cn("flex w-full group", isMe ? "justify-end" : "justify-start")}>
                <div className={cn("flex max-w-[90%] sm:max-w-[75%] md:max-w-[65%] relative gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                  
                  {/* Bubble */}
                  <div className={cn(
                    "relative p-3 sm:p-4 shadow-sm",
                    isMe 
                      ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm" 
                      : "bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm"
                  )}>
                    {/* Sender Name for Others */}
                    {!isMe && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-black text-indigo-600 uppercase tracking-tight">{item.users?.full_name}</span>
                        {item.users?.role === "Dosen" && !isDeleted && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-black text-[7px] uppercase px-1.5 py-0 h-4 leading-none tracking-widest">
                            DOSEN
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Edit Comment Area vs Display Content */}
                    {!isDeleted && editingCommentId === item.id ? (
                       <div className="space-y-2">
                         <Textarea
                           value={editedCommentContent}
                           onChange={(e) => setEditedCommentContent(e.target.value)}
                           className={cn("text-sm font-medium border-0 focus:ring-0 resize-none min-h-[60px] p-0 w-full bg-transparent", isMe ? "text-white placeholder:text-indigo-200" : "text-slate-700")}
                           placeholder="Edit komentar..."
                         />
                         <input
                           type="url"
                           value={editedCommentFileUrl}
                           onChange={(e) => setEditedCommentFileUrl(e.target.value)}
                           className={cn("w-full text-xs font-medium border-b focus:outline-none pb-1 bg-transparent", isMe ? "text-white border-indigo-400 focus:border-white placeholder:text-indigo-200" : "text-slate-600 border-slate-300 focus:border-indigo-500")}
                           placeholder="Lampiran URL (opsional)"
                         />
                         <div className="flex gap-2 justify-end">
                           <Button
                             onClick={async () => {
                               if (!editedCommentContent.trim()) return;
                               const formData = new FormData();
                               formData.append("komentarId", item.id);
                               formData.append("konten", editedCommentContent);
                               if (editedCommentFileUrl) formData.append("fileUrl", editedCommentFileUrl);
                               startTransition(async () => {
                                 const result = await updateLmsForumKomentarAction(formData);
                                 if (result.success) {
                                   success("Komentar berhasil diperbarui");
                                   setEditingCommentId(null);
                                   router.refresh();
                                 } else {
                                   error(result.error || "Gagal memperbarui komentar");
                                 }
                               });
                             }}
                             disabled={isPending}
                             variant="secondary"
                             className="h-7 text-[10px] px-3 rounded-lg font-black uppercase tracking-widest"
                           >
                             Simpan
                           </Button>
                           <Button
                             onClick={() => {
                               setEditingCommentId(null);
                               setEditedCommentContent("");
                               setEditedCommentFileUrl("");
                             }}
                             variant="ghost"
                             className={cn("h-7 text-[10px] px-3 rounded-lg font-bold uppercase tracking-widest", isMe ? "text-white hover:bg-indigo-500" : "")}
                           >
                             Batal
                           </Button>
                         </div>
                       </div>
                    ) : (
                      <div className={cn("text-sm leading-relaxed whitespace-pre-wrap font-medium break-words", isDeleted && "italic opacity-70")}>
                        {item.konten}
                        {item.file_url && !isDeleted && (
                          <a href={item.file_url} target="_blank" rel="noopener noreferrer" className={cn("mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors w-max", isMe ? "bg-white/20 text-white hover:bg-white/30" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
                            <Pin className="h-3 w-3" /> Lampiran
                          </a>
                        )}
                      </div>
                    )}

                    {/* Time and Dropdown Container */}
                    <div className={cn(
                      "text-[9px] font-bold mt-2 flex justify-end items-center gap-2",
                      isMe ? "text-indigo-200" : "text-slate-400"
                    )}>
                      {!isDeleted && !editingCommentId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className={cn("h-5 w-5 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100", isMe ? "text-indigo-200 hover:text-white hover:bg-indigo-500" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100")}>
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isMe ? "end" : "start"} className="rounded-xl border-slate-200">
                            {isMe && (
                              <DropdownMenuItem onClick={() => { 
                                setEditingCommentId(item.id); 
                                setEditedCommentContent(item.konten); 
                                setEditedCommentFileUrl(item.file_url || "");
                              }} className="text-slate-700 cursor-pointer">
                                <Pencil className="h-4 w-4 mr-2" /> Edit Komentar
                              </DropdownMenuItem>
                            )}
                            {canDeleteComment && (
                              <DropdownMenuItem 
                                onClick={async () => {
                                  if (!confirm("Apakah Anda yakin ingin menghapus komentar ini?")) return;
                                  const formData = new FormData();
                                  formData.append("komentarId", item.id);
                                  formData.append("jadwalId", topik.jadwal_id);
                                  formData.append("topikId", topik.id);
                                  startTransition(async () => {
                                    const result = await deleteLmsForumKomentarAction(formData);
                                    if (result.success) {
                                      success("Komentar berhasil dihapus");
                                      router.refresh();
                                    } else {
                                      error(result.error || "Gagal menghapus komentar");
                                    }
                                  });
                                }}
                                className="text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Hapus Komentar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <span className="select-none">{new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} className="h-1" />
      </div>

      {/* Reply Box */}
      {canComment && (
        <div className="bg-white/90 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 sticky bottom-0 z-50">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-4xl mx-auto">
            {showFileUrlInput && (
              <div className="flex animate-in slide-in-from-bottom-2 fade-in pb-1">
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="Masukkan URL lampiran..."
                  className="flex-1 bg-white border border-slate-200 text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                />
              </div>
            )}
            <div className="flex gap-2 sm:gap-3 items-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowFileUrlInput(!showFileUrlInput)}
                className={cn("h-12 w-12 rounded-full shrink-0", showFileUrlInput ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-slate-600")}
              >
                <Pin className="h-5 w-5 transform rotate-45" />
              </Button>
              <div className="flex-1 bg-slate-100 rounded-3xl border border-slate-200 px-4 py-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-inner">
              <Textarea
                placeholder="Tulis pesan..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                className="border-none bg-transparent focus:ring-0 font-medium min-h-[40px] max-h-[120px] resize-none py-2 shadow-none px-0"
              />
            </div>
            <Button
              type="submit"
              disabled={isPending || (!newComment.trim() && !fileUrl.trim())}
              className="h-12 w-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all active:scale-95 shrink-0"
            >
              {isPending ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
            </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
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
