"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, Wallet, History, RefreshCw } from "lucide-react";

interface TabSummaryProps {
  summary: { balance: number; income: number; expense: number };
  totalReceivables: number;
  pendingPayments: number;
  onSyncStatus: () => void;
  isPending: boolean;
}

export default function TabSummary({ summary, totalReceivables, pendingPayments, onSyncStatus, isPending }: TabSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <Card className="bg-slate-900 text-white border-none shadow-lg rounded-none overflow-hidden relative group md:col-span-2">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 to-transparent" />
        <div className="relative p-5 flex items-center justify-between">
          <div>
             <div className="flex items-center justify-between mb-2">
               <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Saldo Kas STAI</p>
             </div>
             <h3 className="text-2xl font-black tracking-tight">{formatCurrency(summary.balance)}</h3>
             <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 font-black">
                   <ArrowUpRight className="h-3 w-3" /> {formatCurrency(summary.income)}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20 font-black">
                   <ArrowDownLeft className="h-3 w-3" /> {formatCurrency(summary.expense)}
                </div>
             </div>
          </div>
          <Button 
            onClick={onSyncStatus} 
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none font-black text-[9px] uppercase tracking-widest h-10 px-4 shadow-xl"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-2", isPending && "animate-spin")} />
            Sync Status Mhs
          </Button>
        </div>
      </Card>
      
      <Card className="bg-white border-slate-100 p-5 shadow-sm rounded-none flex flex-col justify-center">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Piutang Mhs</p>
          <Wallet className="h-4 w-4 text-amber-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">{formatCurrency(totalReceivables)}</h3>
        <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Total Tagihan Tertunda</p>
      </Card>

      <Card className="bg-white border-slate-100 p-5 shadow-sm rounded-none flex flex-col justify-center">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verifikasi</p>
          <History className="h-4 w-4 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">{pendingPayments}</h3>
        <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Konfirmasi Menunggu</p>
      </Card>
    </div>
  );
}
