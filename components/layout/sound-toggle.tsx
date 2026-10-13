"use client";

import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useChrome } from "@/components/layout/chrome-provider";

export function SoundToggle() {
  const { soundEnabled, setSoundEnabled } = useChrome();

  return (
    <button
      aria-label={soundEnabled ? "Mute keyboard sounds" : "Unmute keyboard sounds"}
      aria-pressed={soundEnabled}
      className="flex size-9 items-center justify-center rounded-full bg-surface text-muted transition-colors hover:bg-surface-strong hover:text-foreground"
      onClick={() => setSoundEnabled(!soundEnabled)}
      type="button"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex"
          exit={{ opacity: 0, scale: 0.6 }}
          initial={{ opacity: 0, scale: 0.6 }}
          key={soundEnabled ? "on" : "off"}
          transition={{ duration: 0.15 }}
        >
          {soundEnabled ? (
            <SpeakerHigh size={16} weight="duotone" />
          ) : (
            <SpeakerSlash className="opacity-60" size={16} weight="duotone" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
