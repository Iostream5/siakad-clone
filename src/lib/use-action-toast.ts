"use client";

import { useEffect, useRef } from "react";

import { useToast } from "@/components/ui/toast-provider";

type ActionStateLike = {
  success: boolean;
  message: string | null;
};

export function useActionToast(state: ActionStateLike, successTitle: string, errorTitle = "Proses gagal") {
  const { success, error } = useToast();
  const lastStateRef = useRef<ActionStateLike | null>(null);

  useEffect(() => {
    if (!state.message || lastStateRef.current === state) {
      return;
    }

    lastStateRef.current = state;

    if (state.success) {
      success(successTitle, state.message);
      return;
    }

    error(errorTitle, state.message);
  }, [error, errorTitle, state, success, successTitle]);
}
