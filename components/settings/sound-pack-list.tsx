"use client";

import { Check, CloudArrowDown, Play } from "@phosphor-icons/react";
import { previewPack } from "@/lib/keyboard/sound";
import { SOUND_PACK_OPTIONS, type SoundPackId } from "@/lib/settings/options";
import { cn } from "@/lib/utils";

export function SoundPackList({
  active,
  onSelect,
  volume,
}: {
  active: SoundPackId;
  onSelect: (pack: SoundPackId) => void;
  volume: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      {SOUND_PACK_OPTIONS.map((pack) => {
        const selected = pack.id === active;
        return (
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl pr-2 transition-colors",
              selected ? "bg-surface-strong" : "hover:bg-surface",
            )}
            key={pack.id}
          >
            <button
              aria-pressed={selected}
              className="flex min-w-0 flex-1 items-center justify-between gap-3 py-3 pl-3.5 text-left"
              onClick={() => {
                onSelect(pack.id);
                previewPack(pack.id, volume);
              }}
              type="button"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-[14px]",
                    selected ? "font-medium text-foreground" : "text-muted",
                  )}
                >
                  {pack.label}
                  {pack.remote && (
                    <CloudArrowDown
                      aria-label="Streamed from storage"
                      className="text-subtle"
                      size={13}
                      weight="duotone"
                    />
                  )}
                </span>
                <span className="truncate text-subtle text-xs">{pack.description}</span>
              </span>
              {selected && <Check className="shrink-0 text-primary" size={14} weight="bold" />}
            </button>
            <button
              aria-label={`Preview ${pack.label}`}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted transition-colors hover:bg-primary-soft hover:text-primary"
              onClick={() => previewPack(pack.id, volume)}
              type="button"
            >
              <Play size={12} weight="fill" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
