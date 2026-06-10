import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-[0.92rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] px-3.5 py-2 text-white hover:bg-[var(--primary-strong)]",
        secondary: "bg-white/80 px-3.5 py-2 text-[var(--foreground)] ring-1 ring-black/10 hover:bg-white",
        ghost: "px-3 py-2 text-[var(--muted-foreground)] hover:bg-black/5 hover:text-[var(--foreground)]",
        outline: "border border-slate-200 bg-transparent text-slate-900 hover:bg-slate-100",
        destructive: "bg-rose-600 px-3.5 py-2 text-white hover:bg-rose-700",
        success: "bg-emerald-600 px-3.5 py-2 text-white hover:bg-emerald-700",
      },
      size: {
        default: "h-10",
        sm: "h-8 px-3 text-[0.85rem]",
        lg: "h-11 px-4.5 text-[0.98rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
