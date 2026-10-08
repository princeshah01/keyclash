"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex size-9 items-center justify-center rounded-full bg-surface text-muted transition-colors hover:bg-surface-strong hover:text-foreground"
      onClick={() => setTheme(dark ? "light" : "dark")}
      type="button"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          className="inline-flex"
          exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
          initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
          key={dark ? "moon" : "sun"}
          transition={{ duration: 0.18 }}
        >
          {dark ? <Moon size={16} weight="duotone" /> : <Sun size={16} weight="duotone" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
