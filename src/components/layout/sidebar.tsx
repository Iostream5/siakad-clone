"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  BookOpenCheck,
  CircleDollarSign,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  Lock,
  NotebookPen,
  PanelLeftOpen,
  PanelLeftClose,
  RefreshCw,
  School,
  Settings,
  Users,
  Megaphone,
  DoorOpen,
  Calendar,
  Building2,
  Library,
  BookOpen,
  UserCheck,
  User,
  Landmark,
  Settings2,
  Wallet,
  History,
  TrendingUp,
  Bell,
  SlidersHorizontal,
  Wrench,
  CreditCard,
  Menu,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { SessionUser, SidebarItem } from "@/types/domain";

const itemMeta = {
  "/dashboard": { icon: LayoutDashboard, accent: "text-amber-300", badge: null },
  "/dashboard/pengumuman": { icon: Megaphone, accent: "text-cyan-300", badge: null },
  "/dashboard/master-data": { icon: Library, accent: "text-lime-300", badge: null },
  "/dashboard/master-data/kampus": { icon: Building2, accent: "text-cyan-300", badge: null },
  "/dashboard/master-data/tahun-akademik": { icon: Calendar, accent: "text-sky-300", badge: null },
  "/dashboard/master-data/fakultas": { icon: Building2, accent: "text-indigo-300", badge: null },
  "/dashboard/master-data/program-studi": { icon: Library, accent: "text-purple-300", badge: null },
  "/dashboard/master-data/kelas": { icon: GraduationCap, accent: "text-violet-300", badge: null },
  "/dashboard/master-data/kurikulum": { icon: BookOpenCheck, accent: "text-emerald-300", badge: null },
  "/dashboard/master-data/mata-kuliah": { icon: BookOpen, accent: "text-emerald-300", badge: null },
  "/dashboard/master-data/jadwal-kuliah": { icon: Calendar, accent: "text-sky-300", badge: null },
  "/dashboard/master-data/dosen": { icon: UserCheck, accent: "text-orange-300", badge: null },
  "/dashboard/master-data/mahasiswa": { icon: User, accent: "text-rose-300", badge: null },
  "/dashboard/master-data/ruangan": { icon: DoorOpen, accent: "text-amber-300", badge: null },
  "/dashboard/master-data/pengguna": { icon: Users, accent: "text-slate-300", badge: null },
  "/dashboard/pmb": { icon: GraduationCap, accent: "text-fuchsia-300", badge: "8" },
  "/dashboard/pmb?tab=overview": { icon: LayoutDashboard, accent: "text-fuchsia-300", badge: null },
  "/dashboard/pmb?tab=tarif": { icon: Wallet, accent: "text-amber-300", badge: null },
  "/dashboard/pmb?tab=pendaftar": { icon: Users, accent: "text-cyan-300", badge: null },
  "/dashboard/pmb?tab=pembayaran": { icon: CircleDollarSign, accent: "text-emerald-300", badge: null },
  "/dashboard/pmb?tab=seleksi": { icon: ClipboardCheck, accent: "text-violet-300", badge: null },
  "/dashboard/pmb?tab=registrasi": { icon: UserCheck, accent: "text-sky-300", badge: null },
  "/dashboard/registrasi": { icon: ClipboardCheck, accent: "text-cyan-300", badge: "4" },
  "/dashboard/krs": { icon: BookOpenCheck, accent: "text-violet-300", badge: "3" },
  "/dashboard/nilai": { icon: NotebookPen, accent: "text-sky-300", badge: "2" },
  "/dashboard/akademik/lms": { icon: School, accent: "text-emerald-300", badge: null },
  "/dashboard/keuangan": { icon: CircleDollarSign, accent: "text-rose-300", badge: null },
  "/dashboard/keuangan?tab=pmb": { icon: GraduationCap, accent: "text-emerald-300", badge: null },
  "/dashboard/keuangan?tab=setup": { icon: Settings2, accent: "text-amber-300", badge: null },
  "/dashboard/keuangan?tab=summary": { icon: Landmark, accent: "text-cyan-300", badge: null },
  "/dashboard/keuangan?tab=transaksi": { icon: History, accent: "text-blue-300", badge: null },
  "/dashboard/keuangan?tab=tagihan": { icon: Wallet, accent: "text-emerald-300", badge: null },
  "/dashboard/keuangan?tab=pembayaran": { icon: CircleDollarSign, accent: "text-rose-300", badge: null },
  "/dashboard/keuangan?tab=cashflow": { icon: TrendingUp, accent: "text-sky-300", badge: null },
  "/dashboard/keuangan?tab=laporan": { icon: LineChart, accent: "text-emerald-300", badge: null },
  "/dashboard/laporan": { icon: LineChart, accent: "text-emerald-300", badge: null },
  "/dashboard/pengaturan": { icon: Settings, accent: "text-amber-300", badge: null },
  "/dashboard/pengaturan/akun-akses": { icon: Users, accent: "text-cyan-300", badge: null },
  "/dashboard/pengaturan/menu-builder": { icon: Menu, accent: "text-slate-300", badge: null },
  "/dashboard/pengaturan/settings": { icon: SlidersHorizontal, accent: "text-lime-300", badge: null },
  "/dashboard/pengaturan/payment-gateway": { icon: CreditCard, accent: "text-emerald-300", badge: null },
  "/dashboard/pengaturan/template-notifikasi": { icon: Bell, accent: "text-sky-300", badge: null },
  "/dashboard/pengaturan/audit-login": { icon: Lock, accent: "text-rose-300", badge: null },
  "/dashboard/pengaturan/audit-aktivitas": { icon: History, accent: "text-amber-300", badge: null },
  "/dashboard/pengaturan/developer-tools": { icon: Wrench, accent: "text-violet-300", badge: null },
} as const;

type SidebarItemMeta = (typeof itemMeta)[keyof typeof itemMeta];

export function Sidebar({
  user,
  items,
  collapsed,
  mobileOpen,
  onToggle,
  onCloseMobile,
}: {
  user: SessionUser;
  items: SidebarItem[];
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    "/dashboard/master-data": true,
  });
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    const syncHash = () => setCurrentHash(window.location.hash);

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const utilityItems = useMemo(
    () => [
      {
        label: collapsed ? "Tampilkan Menu" : "Sembunyikan Menu",
        icon: collapsed ? PanelLeftOpen : PanelLeftClose,
        accent: "text-cyan-300",
        onClick: onToggle,
      },
      {
        label: "Sinkronisasi Data",
        icon: RefreshCw,
        accent: "text-cyan-300",
      },
      {
        label: "Pengaturan Sistem",
        icon: Settings,
        accent: "text-lime-300",
      },
      {
        label: "Keamanan Akses",
        icon: Lock,
        accent: "text-amber-300",
      },
    ],
    [collapsed, onToggle],
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col justify-between overflow-visible border-r border-slate-800/80 bg-[linear-gradient(180deg,#202333_0%,#232738_42%,#1f2432_100%)] p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.28)] transition-[transform,width,padding] duration-300 lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        collapsed ? "w-[5.25rem]" : "w-[17rem]",
      )}
    >
      <button
        type="button"
        aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
        onClick={onToggle}
        className={cn(
          "absolute -right-3 top-24 z-[70] hidden h-8 w-8 items-center justify-center rounded-full border border-slate-600/80 bg-[linear-gradient(180deg,#232738_0%,#1f2432_100%)] text-slate-200 shadow-[0_12px_24px_rgba(15,23,42,0.24)] transition hover:scale-105 hover:border-slate-500 hover:text-white lg:flex",
          collapsed ? "border-slate-500 bg-[linear-gradient(180deg,#2a3145_0%,#20273a_100%)] text-cyan-200" : "",
        )}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <div className="shrink-0">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-white/12 bg-white/95 shadow-[0_10px_25px_rgba(15,23,42,0.22)]">
              <Image src="/logostai.png" alt="Logo STAI" width={40} height={40} className="h-8 w-8 object-contain" />
            </div>
            {!collapsed ? (
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">SIAKAD STAI</p>
                <h1 className="mt-1 text-[1.05rem] font-semibold">Menu Kampus</h1>
              </div>
            ) : null}
          </div>
          {!collapsed ? (
            <p className="mt-3 text-[0.78rem] leading-6 text-slate-300">
              Pola menu dibuat lebih dekat ke SIAKAD lama, tetapi tetap rapi dan modern.
            </p>
          ) : null}
        </div>

        <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto pr-1 pt-14">
          <div className="space-y-2.5">
          {!collapsed ? <p className="px-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">Menu Utama</p> : null}
          {items.map((item) => {
            const meta = itemMeta[item.href as keyof typeof itemMeta] || { icon: Megaphone, accent: "text-slate-300", badge: null };
            const Icon = meta.icon;
            const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            const hasChildren = Boolean(item.children?.length);
            const isOpen = collapsed ? false : (openMenus[item.href] ?? active);

            return (
              <div key={item.href} className="space-y-1.5">
                {hasChildren && !collapsed ? (
                  <button
                    type="button"
                    onClick={() => setOpenMenus((value) => ({ ...value, [item.href]: !isOpen }))}
                    className={cn(
                      "group flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left text-[0.84rem] transition",
                      active
                        ? "border-white/16 bg-white/10 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] backdrop-blur"
                        : "border-transparent bg-white/3 text-slate-200 hover:border-white/10 hover:bg-white/8 hover:text-white",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl border transition",
                        active ? "border-white/10 bg-white/12" : "border-white/6 bg-white/6 group-hover:bg-white/10",
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", meta.accent)} />
                    </span>
                    <span className="flex-1 font-semibold">{item.label}</span>
                    {meta.badge ? <span className="rounded-full bg-blue-500/90 px-2 py-0.5 text-[11px] font-semibold text-white">{meta.badge}</span> : null}
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-300" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "group flex items-center rounded-2xl border transition",
                      collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2.5 text-[0.84rem]",
                      active
                        ? "border-white/16 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] text-white shadow-[0_14px_30px_rgba(15,23,42,0.2)] backdrop-blur"
                        : "border-transparent bg-white/3 text-slate-200 hover:border-white/10 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] hover:text-white hover:backdrop-blur",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span
                      className={cn(
                        "flex items-center justify-center rounded-xl border transition",
                        collapsed ? "h-9 w-9" : "h-8 w-8",
                        active ? "border-white/10 bg-white/12" : "border-white/6 bg-white/6 group-hover:bg-white/10",
                      )}
                    >
                      <Icon className={cn(collapsed ? "h-4 w-4" : "h-3.5 w-3.5", meta.accent)} />
                    </span>
                    {!collapsed ? <span className="flex-1 font-semibold">{item.label}</span> : null}
                    {!collapsed && meta.badge ? (
                      <span className="rounded-full bg-blue-500/90 px-2 py-0.5 text-[11px] font-semibold text-white">{meta.badge}</span>
                    ) : null}
                  </Link>
                )}

                {!collapsed && hasChildren && isOpen ? (
                  <div className="ml-4 space-y-1 border-l border-white/8 pl-4">
                    {item.children?.map((child) => {
                      let childActive = false;
                      if (child.href.includes("?")) {
                         const searchStr = child.href.split("?")[1];
                         const params = new URLSearchParams(searchStr);
                         childActive = true;
                         for (const [k, v] of params.entries()) {
                            if (searchParams.get(k) !== v) childActive = false;
                         }
                      } else {
                         const childHash = child.href.startsWith(item.href) ? child.href.slice(item.href.length) : "";
                         childActive =
                          pathname === child.href ||
                          pathname.startsWith(`${child.href}/`) ||
                          (pathname === item.href && childHash.startsWith("#") && currentHash === childHash);
                      }

                      const childMeta = itemMeta[child.href as keyof typeof itemMeta] as SidebarItemMeta | undefined;
                      const ChildIcon = childMeta?.icon;
                      const hasGrandChildren = Boolean(child.children?.length);
                      const isChildOpen = openMenus[child.key] ?? false;

                      if (hasGrandChildren) {
                         const isGrandChildActive = child.children?.some(gc => {
                            if (gc.href.includes("?")) {
                               const searchStr = gc.href.split("?")[1];
                               const params = new URLSearchParams(searchStr);
                               for (const [k, v] of params.entries()) {
                                  if (searchParams.get(k) !== v) return false;
                               }
                               return true;
                            }
                            return pathname === gc.href;
                         });

                         const actuallyOpen = isChildOpen || isGrandChildActive;

                         return (
                            <div key={child.key} className="space-y-1">
                              <button
                                type="button"
                                onClick={() => setOpenMenus((value) => ({ ...value, [child.key]: !actuallyOpen }))}
                                className={cn(
                                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[0.78rem] transition text-left",
                                  isGrandChildActive || actuallyOpen
                                    ? "text-white font-bold"
                                    : "text-slate-300 hover:bg-white/8 hover:text-white hover:backdrop-blur"
                                )}
                              >
                                {ChildIcon ? (
                                  <ChildIcon className={cn("h-3.5 w-3.5", isGrandChildActive ? "text-cyan-300" : childMeta?.accent)} />
                                ) : (
                                  <span className={cn("h-1 w-1 rounded-full", isGrandChildActive ? "bg-cyan-300" : "bg-slate-500")} />
                                )}
                                <span className="flex-1 truncate">{child.label}</span>
                                {actuallyOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-300" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                              </button>

                              {actuallyOpen && (
                                <div className="ml-4 space-y-1 border-l border-white/8 pl-4">
                                  {child.children?.map((gc) => {
                                    const gcMeta = itemMeta[gc.href as keyof typeof itemMeta] as SidebarItemMeta | undefined;
                                    const GCIcon = gcMeta?.icon;
                                    let gcActive = false;
                                    if (gc.href.includes("?")) {
                                       const searchStr = gc.href.split("?")[1];
                                       const params = new URLSearchParams(searchStr);
                                       gcActive = true;
                                       for (const [k, v] of params.entries()) {
                                          if (searchParams.get(k) !== v) gcActive = false;
                                       }
                                    } else {
                                       gcActive = pathname === gc.href;
                                    }

                                    return (
                                      <Link
                                        key={gc.key}
                                        href={gc.href}
                                        onClick={onCloseMobile}
                                        className={cn(
                                          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[0.78rem] transition",
                                          gcActive
                                            ? "bg-[linear-gradient(135deg,rgba(20,184,166,0.2),rgba(59,130,246,0.16))] text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)] backdrop-blur"
                                            : "text-slate-400 hover:bg-white/8 hover:text-white hover:backdrop-blur",
                                        )}
                                      >
                                        {GCIcon ? (
                                          <GCIcon className={cn("h-3 w-3", gcActive ? "text-cyan-300" : gcMeta?.accent)} />
                                        ) : (
                                          <span className={cn("h-1 w-1 rounded-full", gcActive ? "bg-cyan-300" : "bg-slate-600")} />
                                        )}
                                        <span className="flex-1 truncate">{gc.label}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                         );
                      }

                      return (
                        <Link
                          key={child.key}
                          href={child.href}
                          onClick={onCloseMobile}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[0.78rem] transition",
                            childActive
                              ? "bg-[linear-gradient(135deg,rgba(20,184,166,0.2),rgba(59,130,246,0.16))] text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)] backdrop-blur"
                              : "text-slate-300 hover:bg-white/8 hover:text-white hover:backdrop-blur",
                          )}
                        >
                          {ChildIcon ? (
                            <ChildIcon className={cn("h-3.5 w-3.5", childActive ? "text-cyan-300" : childMeta?.accent)} />
                          ) : (
                            <span className={cn("h-1 w-1 rounded-full", childActive ? "bg-cyan-300" : "bg-slate-500")} />
                          )}
                          <span className="flex-1 truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}

          <div className="space-y-1.5 border-t border-white/8 pt-3">
            {!collapsed ? <p className="px-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">Utilitas</p> : null}
            {utilityItems.map((item) => {
              const Icon = item.icon;
              const isSidebarToggle = Boolean(item.onClick);

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className={cn(
                    "group flex w-full items-center rounded-2xl border text-left transition",
                    collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2.5 text-[0.8rem]",
                    isSidebarToggle
                      ? "border-white/10 bg-white/8 text-white hover:border-white/20 hover:bg-white/12"
                      : "border-transparent bg-white/3 text-slate-200 hover:border-white/10 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] hover:text-white hover:backdrop-blur",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-xl border border-white/6 bg-white/6",
                      collapsed ? "h-9 w-9" : "h-8 w-8",
                      isSidebarToggle ? "bg-white/10" : "",
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", item.accent)} />
                  </span>
                  {!collapsed ? <span className="flex-1">{item.label}</span> : null}
                </button>
              );
            })}
          </div>
          </div>
        </nav>
      </div>

      <div className={cn("rounded-[1.35rem] bg-white/8 text-slate-200", collapsed ? "p-2.5" : "p-3.5")}>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#f59e0b,#fb7185)] text-sm font-semibold text-slate-950">
            {user.name.slice(0, 1)}
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="mt-0.5 text-[11px] text-slate-300">{user.role}</p>
            </div>
          ) : null}
        </div>
        {!collapsed ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-400/10 px-3 py-2 text-[11px] text-emerald-200">
            <BadgeCheck className="h-3.5 w-3.5" />
            Session aktif
          </div>
        ) : null}
      </div>
    </aside>
  );
}
