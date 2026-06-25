"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";

interface LoadingButtonProps extends ButtonProps {
  loadingText?: string;
}

export function LoadingButton({ children, loadingText, disabled, ...props }: LoadingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || "Menyimpan..."}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export function LoadingActionButton({
  children,
  isLoading,
  loadingText,
  disabled,
  ...props
}: LoadingButtonProps & { isLoading?: boolean }) {
  return (
    <Button disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || "Memproses..."}
        </>
      ) : (
        children
      )}
    </Button>
  );
}