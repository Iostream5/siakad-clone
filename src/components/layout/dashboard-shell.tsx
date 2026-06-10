"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Footer } from "@/components/layout/footer";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PageTransition } from "@/components/ui/page-transition";
import { useUIStore } from "@/hooks/use-ui-store";
import type { SessionUser, SidebarItem } from "@/types/domain";

export function DashboardShell({
  user,
  items,
  children,
}: {
  user: SessionUser;
  items: SidebarItem[];
  children: ReactNode;
}) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  function handleToggleSidebar() {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileSidebarOpen((value) => !value);
      return;
    }

    toggleSidebar();
  }

  return (
    <div className="relative flex min-h-screen">
      <div className="dashboard-bg-overlay" />
      {mobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      <Sidebar
        user={user}
        items={items}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggle={handleToggleSidebar}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div 
        className={`flex min-h-screen flex-1 flex-col transition-[padding-left] duration-300 ${
          sidebarCollapsed ? "lg:pl-[5.25rem]" : "lg:pl-[17rem]"
        }`}
      >
        {/* Fixed Topbar Container */}
        <header
            className={`fixed top-0 right-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/80 backdrop-blur-md transition-[left] duration-300 ${
            sidebarCollapsed ? "lg:left-[5.25rem]" : "lg:left-[17rem]"
          } left-0`}
        >
          <div className="w-full px-4 md:px-8">
            <Topbar user={user} onToggleSidebar={handleToggleSidebar} />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 pt-16">
          <div className="p-4 md:p-8">
            <div className="mx-auto w-full space-y-6">
              <PageTransition>
                {children}
              </PageTransition>
            </div>
          </div>
          
          <div className="px-4 py-6 md:px-8">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
