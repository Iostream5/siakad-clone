"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

import { forgotPasswordAction, type ForgotPasswordActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";

const initialState: ForgotPasswordActionState = {
  success: false,
  message: "",
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="h-10 w-full rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] text-sm font-semibold shadow-[0_10px_20px_rgba(15,118,110,0.2)] hover:brightness-105"
      disabled={pending}
    >
      <span>{pending ? "Memproses..." : "Kirim Link Reset"}</span>
      {!pending ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);
  const { error, success } = useToast();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (state.error) {
      error("Gagal", state.error);
    } else if (state.success) {
      success("Berhasil", state.message);
      setCooldown(30);
    }
  }, [state, error, success]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lupa Password</h1>
          <p className="mt-2 text-sm text-slate-500">
            Masukkan email Anda untuk menerima link reset password.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              <Input
                name="email"
                type="email"
                className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-none placeholder:text-slate-400 focus:border-[var(--primary)]"
                placeholder="nama@kampus.ac.id"
                required
              />
            </div>
          </div>

          {state.error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {state.error}
            </p>
          ) : null}

          {state.success ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {state.message}
            </p>
          ) : null}

          <div className={cooldown > 0 ? "pointer-events-none opacity-50" : ""}>
            <SubmitButton />
          </div>

          {cooldown > 0 ? (
            <p className="text-center text-xs text-slate-500">
              Kirim ulang dalam {cooldown} detik
            </p>
          ) : null}
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-medium text-[var(--primary)] hover:underline">
            Kembali ke Halaman Login
          </Link>
        </div>
      </div>
    </div>
  );
}
