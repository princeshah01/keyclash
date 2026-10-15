"use client";

import { Desktop, Moon, Sun } from "@phosphor-icons/react";
import { motion } from "motion/react";
import type { ColorMode } from "@/lib/settings/options";
import { cn } from "@/lib/utils";

const MODE_ITEMS = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Desktop },
] as const;

export function Switch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 disabled:opacity-40",
        checked ? "bg-primary" : "bg-surface-strong",
      )}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <motion.span
        animate={{ x: checked ? 16 : 0 }}
        className="size-5 rounded-full bg-white shadow-sm"
        transition={{ type: "spring", stiffness: 600, damping: 34 }}
      />
    </button>
  );
}

export function ModeSwitcher({
  onChange,
  value,
}: {
  onChange: (mode: ColorMode) => void;
  value: ColorMode;
}) {
  return (
    <fieldset className="flex items-center rounded-xl bg-surface p-0.5">
      <legend className="sr-only">Color mode</legend>
      {MODE_ITEMS.map(({ key, label, icon: Icon }) => (
        <button
          aria-label={label}
          aria-pressed={value === key}
          className={cn(
            "relative flex size-8 items-center justify-center rounded-[10px] transition-colors",
            value === key ? "text-primary" : "text-subtle hover:text-muted",
          )}
          key={key}
          onClick={() => onChange(key)}
          title={label}
          type="button"
        >
          {value === key && (
            <motion.span
              className="absolute inset-0 rounded-[10px] bg-elevated shadow-sm"
              layoutId="mode-pill"
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            />
          )}
          <Icon className="relative" size={15} weight="duotone" />
        </button>
      ))}
    </fieldset>
  );
}

export function VolumeSlider({
  disabled,
  onChange,
  value,
}: {
  disabled?: boolean;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <input
        aria-label="Volume"
        className="h-1.5 w-28 cursor-pointer accent-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled}
        max={100}
        min={0}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        step={5}
        type="range"
        value={Math.round(value * 100)}
      />
      <span className="w-8 text-right font-mono text-subtle text-xs tabular-nums">
        {Math.round(value * 100)}
      </span>
    </span>
  );
}
