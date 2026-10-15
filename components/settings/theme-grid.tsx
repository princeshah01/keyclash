"use client";

import { Check } from "@phosphor-icons/react";
import { type Accent, THEME_OPTIONS } from "@/lib/settings/options";
import { cn } from "@/lib/utils";

export function ThemeSwatch({
  className,
  colors,
}: {
  className?: string;
  colors: readonly string[];
}) {
  return (
    <span className={cn("flex overflow-hidden rounded-lg ring-1 ring-black/5", className)}>
      {colors.map((color) => (
        <span className="flex-1" key={color} style={{ backgroundColor: color }} />
      ))}
    </span>
  );
}

export function ThemeGrid({
  active,
  onSelect,
}: {
  active: Accent;
  onSelect: (accent: Accent) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {THEME_OPTIONS.map((theme) => {
        const selected = theme.id === active;
        return (
          <button
            aria-pressed={selected}
            className={cn(
              "flex flex-col gap-2.5 rounded-2xl p-2.5 text-left transition-colors",
              selected ? "bg-surface-strong" : "hover:bg-surface",
            )}
            key={theme.id}
            onClick={() => onSelect(theme.id)}
            type="button"
          >
            <ThemeSwatch className="h-6 w-full" colors={theme.colors} />
            <span className="flex items-center justify-between px-0.5">
              <span
                className={cn(
                  "text-[13px]",
                  selected ? "font-medium text-foreground" : "text-muted",
                )}
              >
                {theme.label}
              </span>
              {selected && <Check className="text-primary" size={14} weight="bold" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
