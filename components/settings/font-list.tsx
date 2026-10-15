"use client";

import { Check } from "@phosphor-icons/react";
import { FONT_OPTIONS, type FontId } from "@/lib/settings/options";
import { cn } from "@/lib/utils";

export function FontList({
  active,
  onSelect,
}: {
  active: FontId;
  onSelect: (font: FontId) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {FONT_OPTIONS.map((font) => {
        const selected = font.id === active;
        return (
          <button
            aria-pressed={selected}
            className={cn(
              "flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors",
              selected ? "bg-surface-strong" : "hover:bg-surface",
            )}
            key={font.id}
            onClick={() => onSelect(font.id)}
            type="button"
          >
            <span
              className="flex min-w-0 flex-col gap-1"
              style={{ fontFamily: `var(${font.variable})` }}
            >
              <span className={cn("text-[15px]", selected ? "text-foreground" : "text-muted")}>
                {font.label}
              </span>
              <span className="truncate text-subtle text-xs">the quick brown fox 0123</span>
            </span>
            {selected && <Check className="shrink-0 text-primary" size={14} weight="bold" />}
          </button>
        );
      })}
    </div>
  );
}
