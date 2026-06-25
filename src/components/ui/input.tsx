import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
      <input
        className={cn(
          "h-11 sm:h-10 w-full rounded-lg border border-black/10 bg-white px-3.5 text-base sm:text-[0.92rem] outline-none ring-0 transition placeholder:text-slate-400 focus:border-[var(--primary)]",
          className,
        )}
        {...props}
      />
  );
}
