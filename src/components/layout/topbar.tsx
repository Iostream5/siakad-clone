"use client";

import { useState, useSyncExternalStore, startTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Bell, 
  LogOut, 
  Menu, 
  Search, 
  Moon, 
  Sun, 
  User as UserIcon, 
  Settings, 
  ChevronDown
} from "lucide-react";

import { logoutAction, switchActiveRoleAction } from "@/actions/auth";
import { markNotificationReadAction } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandSearch } from "@/modules/shared/command-search";
import type { NotificationPreviewData } from "@/lib/admin/notifications";
import type { SessionUser } from "@/types/domain";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProfileManager } from "@/modules/dashboard/profile-manager";

function formatNotificationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Baru saja";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function subscribeClientReady() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function useClientReady() {
  return useSyncExternalStore(subscribeClientReady, getClientSnapshot, getServerSnapshot);
}

export function Topbar({
  user,
  onToggleSidebar,
  notificationPreview,
}: {
  user: SessionUser;
  onToggleSidebar: () => void;
  notificationPreview: NotificationPreviewData;
}) {
  const pathname = usePathname();
  const availableRoles = user.availableRoles ?? [user.role];
  const clientReady = useClientReady();
  const [isDark, setIsDark] = useState(false); // Placeholder for theme state
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const unreadCount = notificationPreview.unreadCount;
  const hasUnread = unreadCount > 0;

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";

  };

  if (!clientReady) return null;

  return (
    <div className="sticky top-0 z-40 w-full mb-6">
      {/* Premium Glassmorphism Wrapper */}
      <div className="mx-auto flex h-14 sm:h-16 w-full items-center justify-between rounded-none sm:rounded-2xl bg-white/70 px-2 sm:px-4 shadow-sm backdrop-blur-xl border-0 sm:border sm:border-white/80 sm:ring-1 sm:ring-slate-900/5 transition-all gap-2">
        
        {/* Left Section: Mobile Menu & Greeting */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="h-11 w-11 sm:h-10 sm:w-10 shrink-0 rounded-xl p-0 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight leading-none truncate">
              <span className="sm:hidden">{user.name?.split(' ')[0] || "User"}</span>
              <span className="hidden sm:inline">{getTimeGreeting()}, {user.name?.split(' ')[0] || "User"} 👋</span>
            </h2>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5 sm:mt-1">
              {user.role} Workspace
            </p>
          </div>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-3">
          
          {/* Search Bar - Command Style */}
          <button 
            onClick={() => setIsCommandOpen(true)}
            className="flex items-center gap-2 h-11 sm:h-10 w-11 sm:w-64 rounded-xl border border-slate-200 bg-slate-50/50 sm:px-3 text-sm text-slate-400 transition-all hover:bg-white hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 justify-center sm:justify-start"
            aria-label="Cari"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline flex-1 text-left font-medium">Cari sesuatu...</span>
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-bold text-slate-500 opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          {/* Role Switcher (if multiple roles) */}
          {availableRoles.length > 1 && (
            <form action={switchActiveRoleAction} className="flex items-center">
              <input type="hidden" name="redirectTo" value={pathname || "/dashboard"} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-11 w-11 sm:h-10 sm:w-auto rounded-xl border-slate-200 bg-white font-bold text-xs uppercase tracking-widest text-slate-600 sm:gap-2 p-0 sm:px-4">
                    <span className="hidden sm:inline">{user.role}</span>
                    <span className="sm:hidden text-[10px]">{user.role.substring(0, 3)}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 shadow-xl">
                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Peran Aktif</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableRoles.map((role) => (
                    <DropdownMenuItem key={role} className="p-0">
                       <button type="submit" name="role" value={role} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                          {role}
                       </button>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </form>
          )}

          <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1" />

          {/* Action Icons */}
          <div className="flex items-center gap-0.5 sm:gap-1">
             <Button variant="ghost" className="h-11 w-11 sm:h-10 sm:w-10 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors p-0" onClick={() => setIsDark(!isDark)} aria-label="Toggle tema">
               {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
             </Button>

             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="relative h-11 w-11 sm:h-10 sm:w-10 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors p-0" aria-label="Notifikasi">
                   <Bell className="h-5 w-5" />
                   {hasUnread ? <span className="absolute right-2 top-2.5 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" /> : null}
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent 
                 forceMount
                 align="end" 
                 className="w-[calc(100vw-1rem)] sm:w-80 max-w-80 rounded-2xl border-slate-200 shadow-2xl p-0 overflow-hidden bg-white opacity-100"
                 asChild
               >
                 <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                 >
                   <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-800">Notifikasi</span>
                      <Badge variant="outline" className="bg-white text-[9px]">{unreadCount} Baru</Badge>
                   </div>
                   <div className="max-h-64 overflow-y-auto">
                      {notificationPreview.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex gap-3 border-b border-slate-50 p-4 transition-colors hover:bg-slate-50 ${item.is_read ? "" : "bg-cyan-50/50"}`}
                        >
                          <Link href={item.href || "/dashboard/notifikasi"} className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              {!item.is_read ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-500" /> : null}
                              <div className="min-w-0">
                                <p className="mb-1 truncate text-xs font-bold text-slate-800">{item.judul}</p>
                                <p className="line-clamp-2 text-[10px] font-medium leading-4 text-slate-500">{item.pesan}</p>
                                <p className="mt-2 text-[9px] font-bold uppercase text-slate-400">{formatNotificationDate(item.created_at)}</p>
                              </div>
                            </div>
                          </Link>
                          {!item.is_read ? (
                            <form action={markNotificationReadAction} className="shrink-0">
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="redirectTo" value={pathname || "/dashboard"} />
                              <button
                                type="submit"
                                className="rounded-lg border border-cyan-100 bg-white px-2 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-700 hover:bg-cyan-50"
                              >
                                Dibaca
                              </button>
                            </form>
                          ) : null}
                        </div>
                      ))}
                      {notificationPreview.items.length === 0 ? (
                        <div className="p-6 text-center">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Belum ada notifikasi</p>
                          <p className="mt-2 text-[10px] font-medium text-slate-400">Event akademik dan keuangan akan muncul di sini.</p>
                        </div>
                      ) : null}
                   </div>
                   <div className="p-2 border-t border-slate-100 bg-white">
                      <Link
                        href="/dashboard/notifikasi"
                        className="flex h-8 w-full items-center justify-center rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
                      >
                        Lihat Semua
                      </Link>
                   </div>
                 </motion.div>
               </DropdownMenuContent>
             </DropdownMenu>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 pl-1 pr-4 ml-1">
                <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-100">
                  <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.email || 'user'}&backgroundColor=f1f5f9`} alt={user.name || "User"} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-black">{user.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs font-black text-slate-700 truncate max-w-[100px]">{user.name}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</span>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400 hidden md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              forceMount
              align="end" 
              className="w-64 rounded-2xl border-slate-200 shadow-2xl p-2 bg-white opacity-100"
              asChild
            >
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="flex items-center gap-3 p-3 mb-2 bg-slate-50 rounded-xl border border-slate-100">
                   <Avatar className="h-10 w-10 border border-slate-200">
                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.email || 'user'}&backgroundColor=f1f5f9`} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 font-black">{user.name?.charAt(0) || "U"}</AvatarFallback>
                   </Avatar>
                   <div className="flex flex-col">
                     <span className="text-sm font-black text-slate-900 leading-tight">{user.name}</span>
                     <span className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">{user.email}</span>
                   </div>
                </div>
                
                <DropdownMenuGroup>
                  {isDesktop ? (
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setShowProfileDialog(true);
                      }}
                      className="py-2.5 px-3 rounded-xl cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                    >
                      <UserIcon className="mr-2 h-4 w-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">Profil Saya</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild className="py-2.5 px-3 rounded-xl cursor-pointer hover:bg-slate-50 focus:bg-slate-50">
                      <Link href="/dashboard/profil" className="flex items-center w-full">
                        <UserIcon className="mr-2 h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">Profil Saya</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator className="my-2 bg-slate-100" />
                
                <DropdownMenuItem
                  className="p-0"
                  onSelect={(e) => {
                    e.preventDefault();
                    startTransition(() => {
                      logoutAction();
                    });
                  }}
                >
                  <div className="flex w-full items-center py-2.5 px-3 rounded-xl cursor-pointer bg-rose-50/50 text-rose-600 hover:bg-rose-100 focus:bg-rose-100 transition-colors">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Keluar Aplikasi</span>
                  </div>
                </DropdownMenuItem>
              </motion.div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CommandSearch open={isCommandOpen} setOpen={setIsCommandOpen} />

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50 sm:rounded-2xl">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Profil Pengguna</h2>
              <p className="mt-1 text-sm text-slate-500">Kelola informasi pribadi dan keamanan akun Anda.</p>
            </div>
            <ProfileManager user={user} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Badge({ className, variant, children }: { className?: string; variant?: "default" | "outline"; children: React.ReactNode }) {
  const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2";
  const variants = {
    default: "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80",
    outline: "text-slate-950",
  };
  return <div className={`${base} ${variants[variant || "default"]} ${className}`}>{children}</div>;
}
