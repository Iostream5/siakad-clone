"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
  duration?: number;
};

type ToastInput = {
  title: string;
  message?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  showToast: (input: ToastInput) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toastStyles(variant: ToastVariant) {
  if (variant === "success") {
    return {
      icon: CheckCircle2,
      iconClassName: "text-emerald-500",
      ringClassName: "border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.94),rgba(255,255,255,0.9))]",
      progressClassName: "bg-emerald-500/75",
    };
  }

  if (variant === "error") {
    return {
      icon: AlertCircle,
      iconClassName: "text-rose-500",
      ringClassName: "border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,241,242,0.96),rgba(255,255,255,0.9))]",
      progressClassName: "bg-rose-500/75",
    };
  }

  return {
    icon: Info,
    iconClassName: "text-cyan-500",
    ringClassName: "border-cyan-200/80 bg-[linear-gradient(135deg,rgba(236,254,255,0.96),rgba(255,255,255,0.9))]",
    progressClassName: "bg-cyan-500/75",
  };
}

function ToastCard({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: (id: string) => void;
}) {
  const { icon: Icon, iconClassName, ringClassName, progressClassName } = toastStyles(item.variant);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onClose(item.id);
    }, item.duration ?? 4200);

    return () => window.clearTimeout(timeout);
  }, [item.duration, item.id, onClose]);

  return (
    <div
      className={`group relative overflow-hidden rounded-[1.35rem] border px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur-xl ${ringClassName}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-white/80 p-2 shadow-sm">
          <Icon className={`h-4 w-4 ${iconClassName}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950">{item.title}</p>
          {item.message ? <p className="mt-1 text-sm leading-5 text-slate-600">{item.message}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => onClose(item.id)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/70 hover:text-slate-700"
          aria-label="Tutup notifikasi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/70">
        <div className={`toast-progress h-full rounded-full ${progressClassName}`} />
      </div>
    </div>
  );
}

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((input: ToastInput) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setToasts((current) => [
      ...current,
      {
        id,
        title: input.title,
        message: input.message,
        variant: input.variant ?? "info",
        duration: input.duration,
      },
    ]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success: (title, message) => showToast({ title, message, variant: "success" }),
      error: (title, message) => showToast({ title, message, variant: "error" }),
      info: (title, message) => showToast({ title, message, variant: "info" }),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[220] flex justify-end px-3 pt-24 sm:px-5 lg:px-7">
        <div className="pointer-events-auto flex w-full max-w-sm flex-col gap-3">
          {toasts.map((item) => (
            <ToastCard key={item.id} item={item} onClose={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast harus dipakai di dalam ToastProvider.");
  }

  return context;
}
