"use client";

import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useSettings } from "@/components/settings/settings-provider";
import { cn } from "@/lib/utils";

export function AudioButton() {
  const { preferences, update } = useSettings();
  const enabled = preferences.soundEnabled;

  return (
    <button
      aria-label={enabled ? "Mute audio" : "Unmute audio"}
      aria-pressed={enabled}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-surface-strong",
        enabled ? "text-muted hover:text-foreground" : "text-subtle",
      )}
      onClick={() => update({ soundEnabled: !enabled })}
      title={enabled ? "Mute audio" : "Unmute audio"}
      type="button"
    >
      <motion.span
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex"
        initial={{ opacity: 0, scale: 0.6 }}
        key={enabled ? "on" : "off"}
        transition={{ duration: 0.18 }}
      >
        {enabled ? (
          <SpeakerHigh size={16} weight="duotone" />
        ) : (
          <SpeakerSlash size={16} weight="duotone" />
        )}
      </motion.span>
    </button>
  );
}
