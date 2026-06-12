"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  LayoutDashboard,
  Settings,
  User,
  BookOpen,
  School,
  Landmark,
  ShieldCheck,
  Wrench,
  Database,
  History,
  GraduationCap,
  Loader2
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { searchMahasiswaAction } from "@/actions/mahasiswa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function CommandSearch({ 
  open, 
  setOpen 
}: { 
  open: boolean; 
  setOpen: (open: boolean) => void 
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const resetSearch = React.useCallback(() => {
    setQuery("");
    setResults([]);
    setIsLoading(false);
  }, []);

  const handleQueryChange = React.useCallback((value: string) => {
    setQuery(value);
    if (!value || value.length < 2) {
      setResults([]);
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  // Dynamic Search Logic
  React.useEffect(() => {
    if (!query || query.length < 2) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchMahasiswaAction(query);
        if (!cancelled) setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    resetSearch();
    command();
  }, [resetSearch, setOpen]);

  return (
    <CommandDialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) resetSearch();
    }}>
      <CommandInput 
        placeholder="Ketik perintah atau cari mahasiswa..." 
        value={query}
        onValueChange={handleQueryChange}
      />
      <CommandList className="max-h-[450px]">
        {isLoading && (
          <div className="p-4 flex items-center justify-center text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-xs font-bold uppercase tracking-widest">Mencari Database...</span>
          </div>
        )}
        
        <CommandEmpty>Hasil tidak ditemukan.</CommandEmpty>
        
        {results.length > 0 && (
          <>
            <CommandGroup heading="Hasil Pencarian Mahasiswa">
              {results.map((mhs) => (
                <CommandItem 
                  key={mhs.id} 
                  onSelect={() => runCommand(() => router.push(`/dashboard/master-data/mahasiswa?id=${mhs.id}`))}
                  className="flex items-center gap-3 py-3"
                >
                  <Avatar className="h-8 w-8 border border-slate-100">
                    <AvatarImage src={mhs.avatar} />
                    <AvatarFallback className="bg-emerald-50 text-emerald-700 text-[10px] font-black">{mhs.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 uppercase text-xs leading-none mb-1">{mhs.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 tracking-tighter">{mhs.nim || 'NIM BELUM DISET'}</span>
                  </div>
                  <CommandShortcut className="text-[9px] font-black uppercase text-emerald-500">MHS</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navigasi Utama">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard Overview</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/akademik/lms"))}>
            <School className="mr-2 h-4 w-4" />
            <span>LMS - E-Learning</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/krs"))}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Manajemen KRS</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/nilai"))}>
            <GraduationCap className="mr-2 h-4 w-4" />
            <span>Hasil Studi & Nilai</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Keuangan">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/keuangan"))}>
            <Landmark className="mr-2 h-4 w-4" />
            <span>Keuangan & Tagihan</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/pengaturan/payment-gateway"))}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Konfigurasi Payment Gateway</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Master Data">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/master-data/mahasiswa"))}>
            <User className="mr-2 h-4 w-4" />
            <span>Data Mahasiswa</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/master-data/dosen"))}>
            <User className="mr-2 h-4 w-4" />
            <span>Data Dosen</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/master-data/mata-kuliah"))}>
            <Database className="mr-2 h-4 w-4" />
            <span>Mata Kuliah</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Pengaturan & Sistem">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/pengaturan/akun-akses"))}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            <span>Keamanan Akun & Akses</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/pengaturan/audit-aktivitas"))}>
            <History className="mr-2 h-4 w-4" />
            <span>Log Audit Aktivitas</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/pengaturan/developer-tools"))}>
            <Wrench className="mr-2 h-4 w-4" />
            <span>Developer Tools</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/pengaturan/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>System Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
