"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const pillGroupClass = "flex items-center rounded-[14px] bg-surface p-1";

const pillEase = { duration: 0.22, ease: [0.23, 1, 0.32, 1] } as const;

interface PillProps {
  active: boolean;
  children: ReactNode;
  className?: string;
  label?: string;
  onClick: () => void;
}

export function TogglePill({ active, children, className, label, onClick }: PillProps) {
  return (
    <motion.button
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 font-medium text-[13px] transition-colors duration-150",
        active ? "text-primary" : "text-subtle hover:text-muted",
        className,
      )}
      onClick={onClick}
      type="button"
      whileTap={{ scale: 0.96 }}
    >
      {children}
    </motion.button>
  );
}

export function SelectPill({
  active,
  children,
  className,
  label,
  layoutId,
  onClick,
}: PillProps & { layoutId: string }) {
  return (
    <motion.button
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "relative flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 font-medium text-[13px] transition-colors duration-150",
        active ? "text-primary" : "text-subtle hover:text-muted",
        className,
      )}
      onClick={onClick}
      type="button"
      whileTap={{ scale: 0.96 }}
    >
      {active && (
        <motion.span
          className="absolute inset-0 rounded-[10px] bg-primary-soft"
          layoutId={layoutId}
          transition={pillEase}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">{children}</span>
    </motion.button>
  );
}

export function PillDivider() {
  return <span aria-hidden className="mx-1 h-4 w-px bg-border" />;
}
