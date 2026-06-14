"use client";

import { useState } from "react";
import { UserCircle, ShieldCheck, Camera, Save, KeyRound } from "lucide-react";
import { useFormStatus } from "react-dom";

import { updateProfileAction, changePasswordAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import type { SessionUser } from "@/types/domain";

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-cyan-600 hover:bg-cyan-700">
      <Save className="mr-2 h-4 w-4" />
      {pending ? "Menyimpan..." : label}
    </Button>
  );
}

export function ProfileManager({ user }: { user: SessionUser }) {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<"umum" | "keamanan">("umum");

  const handleUpdateProfile = async (formData: FormData) => {
    const result = await updateProfileAction(formData);
    if (result.error) {
      error("Gagal Memperbarui Profil", result.error);
    } else {
      success("Profil Diperbarui", "Nama lengkap Anda berhasil disimpan.");
    }
  };

  const handleChangePassword = async (formData: FormData) => {
    const result = await changePasswordAction(formData);
    if (result.error) {
      error("Gagal Mengganti Password", result.error);
    } else {
      success("Password Berhasil Diubah", "Silakan gunakan password baru Anda untuk login berikutnya.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-4">
        <Card className="p-6 text-center shadow-lg shadow-slate-200/50">
          <div className="relative mx-auto w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-4 border-4 border-white shadow-md">
            <UserCircle className="w-20 h-20" />
            <button className="absolute bottom-0 right-0 p-1.5 bg-cyan-600 text-white rounded-full shadow hover:bg-cyan-700 transition">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <h3 className="font-bold text-slate-900">{user.name}</h3>
          <p className="text-sm text-slate-500 mt-1">{user.email || user.identifier}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
              {user.role}
            </span>
          </div>
        </Card>

        <Card className="overflow-hidden shadow-lg shadow-slate-200/50">
          <div className="flex flex-col">
            <button
              onClick={() => setActiveTab("umum")}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                activeTab === "umum" ? "bg-cyan-50 text-cyan-700 border-l-4 border-cyan-600" : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
              }`}
            >
              <UserCircle className="w-4 h-4" /> Informasi Umum
            </button>
            <button
              onClick={() => setActiveTab("keamanan")}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                activeTab === "keamanan" ? "bg-cyan-50 text-cyan-700 border-l-4 border-cyan-600" : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Keamanan Akun
            </button>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        {activeTab === "umum" && (
          <Card className="p-6 shadow-lg shadow-slate-200/50">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-4">Informasi Pribadi</h3>
            <form action={handleUpdateProfile} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Nama Lengkap</label>
                <Input name="fullName" defaultValue={user.name} required minLength={3} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Email</label>
                <Input value={user.email || ""} disabled className="bg-slate-50 text-slate-500" />
                <p className="text-[10px] text-slate-400 mt-1">Email digunakan untuk login dan tidak dapat diubah di sini.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Role Aktif</label>
                <Input value={user.role} disabled className="bg-slate-50 text-slate-500" />
              </div>
              <div className="pt-2">
                <SaveButton label="Simpan Perubahan" />
              </div>
            </form>
          </Card>
        )}

        {activeTab === "keamanan" && (
          <Card className="p-6 shadow-lg shadow-slate-200/50">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-4">Ubah Password</h3>
            <form action={handleChangePassword} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Password Baru</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input type="password" name="password" className="pl-10" placeholder="Minimal 8 karakter" required minLength={8} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Konfirmasi Password Baru</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input type="password" name="confirmPassword" className="pl-10" placeholder="Ulangi password baru" required minLength={8} />
                </div>
              </div>
              <div className="pt-2">
                <SaveButton label="Ganti Password" />
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
