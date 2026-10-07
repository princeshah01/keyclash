"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface PopoverProps {
  align?: "start" | "end";
  children: ReactNode;
  className?: string;
  label: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  trigger: ReactNode;
}

export function Popover({
  align = "end",
  children,
  className,
  label,
  onOpenChange,
  open,
  trigger,
}: PopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onOpenChange]);

  return (
    <div className="relative" ref={rootRef}>
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            aria-label={label}
            className={cn(
              "absolute top-full z-50 mt-2 origin-top rounded-2xl border border-border bg-elevated p-1.5 shadow-[0_18px_50px_-12px_rgb(0_0_0/0.25)]",
              align === "end" ? "right-0" : "left-0",
              className,
            )}
            exit={{ opacity: 0, y: -4, scale: 0.98, filter: "blur(2px)" }}
            initial={{ opacity: 0, y: -6, scale: 0.97, filter: "blur(2px)" }}
            role="dialog"
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
