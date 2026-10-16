"use client";

import { Check, Play } from "@phosphor-icons/react";
import { previewMistake } from "@/lib/keyboard/sound";
import { MISTAKE_SOUND_OPTIONS, type MistakeSoundId } from "@/lib/settings/options";
import { cn } from "@/lib/utils";

export function MistakeSoundList({
  active,
  onSelect,
  volume,
}: {
  active: MistakeSoundId;
  onSelect: (sound: MistakeSoundId) => void;
  volume: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {MISTAKE_SOUND_OPTIONS.map((sound) => {
        const selected = sound.id === active;
        return (
          <div
            className={cn(
              "flex items-center gap-1 rounded-2xl pr-1.5 transition-colors",
              selected ? "bg-surface-strong" : "bg-surface hover:bg-surface-strong",
            )}
            key={sound.id}
          >
            <button
              aria-pressed={selected}
              className="flex min-w-0 flex-1 items-center justify-between gap-2 py-3 pl-3.5 text-left"
              onClick={() => {
                onSelect(sound.id);
                previewMistake(sound.id, volume);
              }}
              type="button"
            >
              <span
                className={cn(
                  "truncate text-[13px]",
                  selected ? "font-medium text-foreground" : "text-muted",
                )}
              >
                {sound.label}
              </span>
              {selected && <Check className="shrink-0 text-primary" size={13} weight="bold" />}
            </button>
            <button
              aria-label={`Preview ${sound.label}`}
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-elevated text-muted transition-colors hover:bg-primary-soft hover:text-primary"
              onClick={() => previewMistake(sound.id, volume)}
              type="button"
            >
              <Play size={11} weight="fill" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
