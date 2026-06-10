"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, LockKeyhole, RefreshCcw, ShieldCheck, UserRound } from "lucide-react";

import { loginAction, type LoginActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";

const initialLoginActionState: LoginActionState = {
  error: null,
};

function createSecurityCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="h-10 w-full rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] text-sm font-semibold shadow-[0_10px_20px_rgba(15,118,110,0.2)] hover:brightness-105"
      disabled={pending}
    >
      <span>{pending ? "Memproses..." : "Masuk"}</span>
      {!pending ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
    </Button>
  );
}

function PendingOverlay() {
  const { pending } = useFormStatus();

  if (!pending) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/35 backdrop-blur-[2px]">
      <div className="rounded-2xl border border-white/25 bg-white/90 px-5 py-4 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-800">Sedang masuk...</p>
        </div>
      </div>
    </div>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialLoginActionState);
  const [securityCode, setSecurityCode] = useState(() => (typeof window === "undefined" ? "" : createSecurityCode()));
  const [securityInput, setSecurityInput] = useState("");
  const [securityError, setSecurityError] = useState<string | null>(null);
  const { error } = useToast();
  const lastErrorRef = useRef<string | null>(null);
  const showAdminHint = Boolean(
    state.error &&
      (state.error.includes("Hubungi admin") ||
        state.error.includes("belum memiliki role") ||
        state.error.includes("belum sinkron")),
  );

  function refreshSecurityCode(resetError = true) {
    setSecurityCode(createSecurityCode());
    setSecurityInput("");
    if (resetError) {
      setSecurityError(null);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!securityCode) {
      event.preventDefault();
      return;
    }

    if (securityInput.trim().toUpperCase() !== securityCode) {
      event.preventDefault();
      setSecurityError("Kode keamanan tidak cocok. Coba lagi.");
      refreshSecurityCode(false);
      error("Kode keamanan salah", "Masukkan ulang kode keamanan yang baru.");
    }
  }

  useEffect(() => {
    if (!state.error || lastErrorRef.current === state.error) {
      return;
    }

    lastErrorRef.current = state.error;
    error("Login gagal", state.error);
  }, [error, state.error]);

  return (
    <form action={formAction} onSubmit={handleSubmit} className="mt-1 space-y-3.5">
      <PendingOverlay />
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-700">Email atau Username</label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
          <Input
            name="identifier"
            className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-none placeholder:text-slate-400 focus:border-[var(--primary)]"
            placeholder="admin atau admin@kampus.ac.id"
            autoComplete="username"
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-700">Password</label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
          <Input
            name="password"
            type="password"
            className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-none placeholder:text-slate-400 focus:border-[var(--primary)]"
            placeholder="Password"
            autoComplete="current-password"
            minLength={6}
            required
          />
        </div>
      </div>
      <div className="space-y-2.5 rounded-xl border border-emerald-100 bg-[linear-gradient(180deg,rgba(236,253,245,0.85),rgba(255,255,255,0.92))] p-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-900">Kode keamanan</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            suppressHydrationWarning
            className="flex h-10 flex-1 items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-slate-950 px-3 font-mono text-sm font-semibold tracking-[0.3em] text-emerald-300"
          >
            {securityCode}
          </div>
          <Button type="button" variant="secondary" className="h-10 rounded-xl px-3 text-xs" onClick={() => refreshSecurityCode()}>
            <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
            Ulang
          </Button>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Tulis kode</label>
          <Input
            value={securityInput}
            onChange={(event) => {
              setSecurityInput(event.target.value.toUpperCase());
              if (securityError) {
                setSecurityError(null);
              }
            }}
            className="h-10 rounded-xl border-slate-200 bg-white text-center font-mono text-sm tracking-[0.25em] uppercase shadow-none focus:border-[var(--primary)]"
            placeholder="KODE"
            inputMode="text"
            maxLength={6}
            required
          />
        </div>
      </div>
      {securityError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {securityError}
        </p>
      ) : null}
      {state.error ? (
        <div className="space-y-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <p>{state.error}</p>
          {showAdminHint ? (
            <p className="text-[11px] text-red-600/90">
              Silakan hubungi admin untuk aktivasi akun atau pengaturan role akses.
            </p>
          ) : null}
        </div>
      ) : null}
      <SubmitButton />
    </form>
  );
}
