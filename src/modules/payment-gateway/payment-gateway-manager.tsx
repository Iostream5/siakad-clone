"use client";

import { useState, useTransition } from "react";
import { 
  CreditCard, 
  Landmark, 
  Save, 
  ShieldCheck, 
  AlertCircle 
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { updateMultipleSettingsAction } from "@/actions/settings";
import type { SystemSettingRow } from "@/lib/admin/phase1-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface PaymentGatewayManagerProps {
  initialSettings: SystemSettingRow[];
}

export function PaymentGatewayManager({ initialSettings }: PaymentGatewayManagerProps) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  // Helper to extract value safely
  const getSettingValue = (key: string) => {
    const setting = initialSettings.find(s => s.key === key);
    if (!setting) return "";
    
    // Handle the nested value object { value: "..." }
    const val = setting.value as any;
    if (val && typeof val === "object" && "value" in val) {
      return val.value;
    }
    return val || "";
  };

  // State for Midtrans
  const [midtransEnabled, setMidtransEnabled] = useState<boolean>(getSettingValue("payment.midtrans.enabled") === true);
  const [midtransProd, setMidtransProd] = useState<boolean>(getSettingValue("payment.midtrans.is_production") === true);
  const [midtransServerKey, setMidtransServerKey] = useState<string>(getSettingValue("payment.midtrans.server_key"));
  const [midtransClientKey, setMidtransClientKey] = useState<string>(getSettingValue("payment.midtrans.client_key"));

  // State for Bank BJB
  const [bjbEnabled, setBjbEnabled] = useState<boolean>(getSettingValue("payment.bjb.enabled") === true);
  const [bjbApiKey, setBjbApiKey] = useState<string>(getSettingValue("payment.bjb.api_key"));
  const [bjbMerchantId, setBjbMerchantId] = useState<string>(getSettingValue("payment.bjb.merchant_id"));

  const [activeTab, setActiveTab] = useState("midtrans");
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  async function handleCheckMidtrans() {
    setIsCheckingConnection(true);
    try {
      // @ts-ignore - Temporary ignore if action is not perfectly typed yet
      const { checkMidtransConnectionAction } = await import("@/actions/settings");
      const result = await checkMidtransConnectionAction(midtransServerKey, midtransProd);
      if (result.success) {
        success(result.message || "Koneksi Midtrans berhasil!");
      } else {
        error(result.error || "Gagal terhubung ke Midtrans.");
      }
    } catch (e) {
      error("Terjadi kesalahan sistem saat mengecek koneksi.");
    } finally {
      setIsCheckingConnection(false);
    }
  }

  async function handleSaveMidtrans() {
    startTransition(async () => {
      const payload = {
        "payment.midtrans.enabled": midtransEnabled,
        "payment.midtrans.is_production": midtransProd,
        "payment.midtrans.server_key": midtransServerKey,
        "payment.midtrans.client_key": midtransClientKey,
      };

      const result = await updateMultipleSettingsAction(payload);
      if (result.success) {
        success("Konfigurasi Midtrans berhasil disimpan.");
      } else {
        error(result.error || "Gagal menyimpan konfigurasi.");
      }
    });
  }

  async function handleSaveBjb() {
    startTransition(async () => {
      const payload = {
        "payment.bjb.enabled": bjbEnabled,
        "payment.bjb.api_key": bjbApiKey,
        "payment.bjb.merchant_id": bjbMerchantId,
      };

      const result = await updateMultipleSettingsAction(payload);
      if (result.success) {
        success("Konfigurasi Bank BJB berhasil disimpan.");
      } else {
        error(result.error || "Gagal menyimpan konfigurasi.");
      }
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-[2rem]">
        <div className="bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] p-10 text-white relative">
           <div className="absolute top-0 right-0 p-10 opacity-10">
              <CreditCard className="h-40 w-40" />
           </div>
           <div className="relative z-10">
              <p className="text-emerald-400 font-black uppercase tracking-[0.3em] text-[10px] mb-3">Finance Configuration</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-none mb-4">Payment Gateway</h1>
              <p className="text-slate-400 text-sm font-medium max-w-lg">
                Atur koneksi API gateway pembayaran untuk memproses tagihan mahasiswa secara otomatis. Kunci rahasia dienkripsi dan disimpan aman.
              </p>
           </div>
        </div>
      </Card>

      <Tabs defaultValue="midtrans" className="w-full" onValueChange={setActiveTab}>
        <div className="flex bg-white/50 p-2 rounded-[1.5rem] border border-slate-200/60 backdrop-blur-sm sticky top-20 z-20 w-fit mb-8">
          <TabsList className="bg-transparent h-auto p-0 gap-1">
            <TabsTrigger 
              value="midtrans" 
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-xl px-8 py-3 text-[11px] font-black uppercase tracking-widest transition-all duration-300"
            >
              <span className="mr-2"><CreditCard className="h-4 w-4" /></span> Midtrans
            </TabsTrigger>
            <TabsTrigger 
              value="bjb" 
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white rounded-xl px-8 py-3 text-[11px] font-black uppercase tracking-widest transition-all duration-300"
            >
              <span className="mr-2"><Landmark className="h-4 w-4" /></span> Bank BJB
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="midtrans" className="animate-in slide-in-from-bottom-4 duration-500">
           <Card className="border-slate-200 shadow-xl rounded-[2rem] overflow-hidden bg-white">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      Konfigurasi Midtrans 
                      {midtransEnabled ? (
                         <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[9px]">Aktif</Badge>
                      ) : (
                         <Badge className="bg-slate-100 text-slate-500 border-slate-200 font-black text-[9px]">Nonaktif</Badge>
                      )}
                   </h2>
                   <p className="text-sm text-slate-500 mt-1">Gunakan Server Key dan Client Key dari dashboard Midtrans Anda.</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                   <CreditCard className="h-6 w-6 text-indigo-600" />
                </div>
             </div>
             
             <div className="p-8 space-y-6">
                <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Checkbox 
                    id="midtransEnabled" 
                    checked={midtransEnabled} 
                    onCheckedChange={(c) => setMidtransEnabled(c as boolean)} 
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="midtransEnabled" className="text-sm font-bold text-slate-900 cursor-pointer">
                      Aktifkan Gateway Midtrans
                    </label>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      Bila aktif, mahasiswa dapat membayar menggunakan Midtrans.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                  <Checkbox 
                    id="midtransProd" 
                    checked={midtransProd} 
                    onCheckedChange={(c) => setMidtransProd(c as boolean)} 
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="midtransProd" className="text-sm font-bold text-amber-900 cursor-pointer">
                      Production Mode
                    </label>
                    <p className="text-[10px] text-amber-700/80 uppercase tracking-widest font-bold">
                      Awas: Jika aktif, transaksi menggunakan uang asli.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                   <div className="space-y-3">
                      <Label htmlFor="serverKey" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        Server Key <ShieldCheck className="h-3 w-3 text-emerald-500" />
                      </Label>
                      <Input 
                        id="serverKey" 
                        type="password"
                        value={midtransServerKey}
                        onChange={(e) => setMidtransServerKey(e.target.value)}
                        placeholder="SB-Mid-server-..."
                        className="h-14 rounded-xl border-slate-200 focus:border-indigo-500 font-mono"
                      />
                   </div>
                   <div className="space-y-3">
                      <Label htmlFor="clientKey" className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Client Key
                      </Label>
                      <Input 
                        id="clientKey" 
                        value={midtransClientKey}
                        onChange={(e) => setMidtransClientKey(e.target.value)}
                        placeholder="SB-Mid-client-..."
                        className="h-14 rounded-xl border-slate-200 focus:border-indigo-500 font-mono"
                      />
                   </div>
                </div>
             </div>
             
             <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <Button 
                  onClick={handleCheckMidtrans}
                  disabled={isCheckingConnection || !midtransServerKey}
                  variant="outline"
                  className="border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-xs h-12 px-6 rounded-xl hover:bg-slate-100"
                >
                  {isCheckingConnection ? "Mengecek..." : "Cek Koneksi"}
                </Button>
                <Button 
                  onClick={handleSaveMidtrans}
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl shadow-lg shadow-indigo-200"
                >
                  {isPending && activeTab === 'midtrans' ? "Menyimpan..." : (
                     <>Simpan Konfigurasi <Save className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
             </div>
           </Card>
        </TabsContent>

        <TabsContent value="bjb" className="animate-in slide-in-from-bottom-4 duration-500">
           <Card className="border-slate-200 shadow-xl rounded-[2rem] overflow-hidden bg-white">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      Konfigurasi Bank BJB 
                      {bjbEnabled ? (
                         <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[9px]">Aktif</Badge>
                      ) : (
                         <Badge className="bg-slate-100 text-slate-500 border-slate-200 font-black text-[9px]">Nonaktif</Badge>
                      )}
                   </h2>
                   <p className="text-sm text-slate-500 mt-1">API Key dan Merchant ID khusus dari Bank BJB untuk pembayaran VA dan Transfer.</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-sky-50 flex items-center justify-center border border-sky-100">
                   <Landmark className="h-6 w-6 text-sky-600" />
                </div>
             </div>
             
             <div className="p-8 space-y-6">
                <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Checkbox 
                    id="bjbEnabled" 
                    checked={bjbEnabled} 
                    onCheckedChange={(c) => setBjbEnabled(c as boolean)} 
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="bjbEnabled" className="text-sm font-bold text-slate-900 cursor-pointer">
                      Aktifkan Gateway Bank BJB
                    </label>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      Gunakan channel BJB Virtual Account.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                   <div className="space-y-3">
                      <Label htmlFor="bjbApiKey" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        BJB API Key <ShieldCheck className="h-3 w-3 text-emerald-500" />
                      </Label>
                      <Input 
                        id="bjbApiKey" 
                        type="password"
                        value={bjbApiKey}
                        onChange={(e) => setBjbApiKey(e.target.value)}
                        placeholder="Key rahasia dari BJB"
                        className="h-14 rounded-xl border-slate-200 focus:border-sky-500 font-mono"
                      />
                   </div>
                   <div className="space-y-3">
                      <Label htmlFor="bjbMerchantId" className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        BJB Merchant ID
                      </Label>
                      <Input 
                        id="bjbMerchantId" 
                        value={bjbMerchantId}
                        onChange={(e) => setBjbMerchantId(e.target.value)}
                        placeholder="ID Institusi / Merchant"
                        className="h-14 rounded-xl border-slate-200 focus:border-sky-500 font-mono"
                      />
                   </div>
                </div>
             </div>
             
             <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <Button 
                  onClick={handleSaveBjb}
                  disabled={isPending}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl shadow-lg shadow-sky-200"
                >
                  {isPending && activeTab === 'bjb' ? "Menyimpan..." : (
                     <>Simpan Konfigurasi <Save className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
             </div>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
