import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary:
    "bg-primary text-primary-foreground hover:brightness-105 active:brightness-95 shadow-[0_6px_20px_-8px_var(--primary)]",
  soft: "bg-primary-soft text-primary hover:bg-primary/25",
  ghost: "text-muted hover:bg-surface-strong hover:text-foreground",
  surface: "bg-surface text-foreground hover:bg-surface-strong",
  danger: "text-danger hover:bg-danger/10",
} as const;

const SIZES = {
  sm: "h-8 gap-1.5 rounded-[10px] px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

export function buttonClass(variant: ButtonVariant = "surface", size: keyof typeof SIZES = "md") {
  return cn(
    "inline-flex select-none items-center justify-center font-medium transition-[background-color,color,filter,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
  );
}

interface ButtonProps extends ComponentProps<"button"> {
  size?: keyof typeof SIZES;
  variant?: ButtonVariant;
}

export function Button({ className, size, type = "button", variant, ...props }: ButtonProps) {
  return <button className={cn(buttonClass(variant, size), className)} type={type} {...props} />;
}
