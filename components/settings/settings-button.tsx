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
        className="flex h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-[13px] text-muted transition-colors hover:bg-surface-strong hover:text-foreground"
        onClick={() => setOpen(true)}
        ref={buttonRef}
        type="button"
      >
        <GearSix size={16} weight="duotone" />
        <span className="hidden md:inline">Settings</span>
        <kbd className="hidden rounded-md border border-border bg-surface px-1 py-0.5 font-mono text-[10px] text-subtle leading-none lg:inline">
          {shortcut}
        </kbd>
      </button>
      <SettingsPanel onOpenChange={handleOpenChange} open={open} shortcut={shortcut} />
    </>
  );
}
