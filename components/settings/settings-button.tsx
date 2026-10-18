"use client";

import { GearSix } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { shortcutLabel, usePlatform } from "@/hooks/use-platform";

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const platform = usePlatform();
  const shortcut = shortcutLabel(platform);

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
        aria-keyshortcuts={platform === "mac" ? "Meta+K" : "Control+K"}
        aria-label="Settings"
        className="flex h-9 items-center gap-2 rounded-full bg-surface px-2.5 text-muted transition-colors hover:bg-surface-strong hover:text-foreground"
        onClick={() => setOpen(true)}
        ref={buttonRef}
        title={`Settings (${shortcut})`}
        type="button"
      >
        <GearSix size={16} weight="duotone" />
        {platform && (
          <kbd className="hidden h-5 items-center gap-0.5 rounded-md border border-border bg-elevated px-1.5 font-medium font-mono text-[10px] text-subtle leading-none sm:inline-flex">
            {platform === "mac" ? (
              <>
                <span className="text-[12px] leading-none">⌘</span>K
              </>
            ) : (
              "Ctrl K"
            )}
          </kbd>
        )}
      </button>
      <SettingsPanel onOpenChange={handleOpenChange} open={open} shortcut={shortcut} />
    </>
  );
}
