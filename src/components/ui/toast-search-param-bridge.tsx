"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { useToast } from "@/components/ui/toast-provider";

export function ToastSearchParamBridge() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const lastToastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const toast = searchParams.get("toast");
    const variant = searchParams.get("toastVariant");
    const title = searchParams.get("toastTitle");
    const message = searchParams.get("toastMessage");

    if (!toast || !variant || !title) {
      return;
    }

    const key = `${variant}:${title}:${message ?? ""}`;

    if (lastToastKeyRef.current === key) {
      return;
    }

    lastToastKeyRef.current = key;
    showToast({
      variant: variant as "success" | "error" | "info",
      title,
      message: message ?? undefined,
    });

    const cleaned = new URLSearchParams(searchParams.toString());
    cleaned.delete("toast");
    cleaned.delete("toastVariant");
    cleaned.delete("toastTitle");
    cleaned.delete("toastMessage");

    const nextUrl = cleaned.toString() ? `${pathname}?${cleaned.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams, showToast]);

  return null;
}
