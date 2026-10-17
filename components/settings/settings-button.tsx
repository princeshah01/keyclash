"use client";

import { GearSix } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SettingsPanel } from "@/components/settings/settings-panel";

function useShortcutLabel() {
  const [label, setLabel] = useState("Ctrl K");
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.userAgent)) {
      setLabel("⌘K");
    }
  }, []);
  return label;
}

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const shortcut = useShortcutLabel();

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      requestAnimationFrame(() => buttonRef.current?.blur());
    }
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        aria-label="Settings"
        className="flex size-9 items-center justify-center rounded-full bg-surface text-muted transition-colors hover:bg-surface-strong hover:text-foreground"
        onClick={() => setOpen(true)}
        ref={buttonRef}
        title={`Settings (${shortcut})`}
        type="button"
      >
        <GearSix size={16} weight="duotone" />
      </button>
      <SettingsPanel onOpenChange={handleOpenChange} open={open} shortcut={shortcut} />
    </>
  );
}
