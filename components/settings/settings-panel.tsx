"use client";

import {
  CaretLeft,
  CaretRight,
  CloudCheck,
  HardDrives,
  Info,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { ModeSwitcher, Switch, VolumeSlider } from "@/components/settings/controls";
import { FontList } from "@/components/settings/font-list";
import { MistakeSoundList } from "@/components/settings/mistake-sound-list";
import { type SettingsStorage, useSettings } from "@/components/settings/settings-provider";
import { SoundPackList } from "@/components/settings/sound-pack-list";
import { ThemeGrid, ThemeSwatch } from "@/components/settings/theme-grid";
import { useMediaQuery } from "@/hooks/use-media-query";
import { previewMistake } from "@/lib/keyboard/sound";
import {
  FONT_OPTIONS,
  MISTAKE_SOUND_OPTIONS,
  SOUND_PACK_OPTIONS,
  THEME_OPTIONS,
} from "@/lib/settings/options";

type Page = "main" | "themes" | "fonts" | "sounds" | "mistakes";

const TITLES: Record<Page, string> = {
  main: "Settings",
  themes: "Themes",
  fonts: "Font",
  sounds: "Sound pack",
  mistakes: "Mistake sound",
};

const STORAGE_COPY: Record<SettingsStorage, { icon: typeof Info; text: string }> = {
  account: { icon: CloudCheck, text: "Synced to your account" },
  browser: { icon: HardDrives, text: "Saved in this browser" },
  session: { icon: Info, text: "Not saved — accept preference cookies to keep these" },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="px-3 pb-1 font-medium text-[10px] text-subtle uppercase tracking-[0.18em]">
        {title}
      </h3>
      <div className="flex flex-col rounded-2xl bg-surface p-1">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-3 py-2">
      <span className="flex min-w-0 flex-col">
        <span className="text-[13px] text-foreground">{label}</span>
        {hint && <span className="text-[11px] text-subtle">{hint}</span>}
      </span>
      {children}
    </div>
  );
}

function SubpageRow({
  label,
  onOpen,
  preview,
}: {
  label: string;
  onOpen: () => void;
  preview: ReactNode;
}) {
  return (
    <button
      className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-strong"
      onClick={onOpen}
      type="button"
    >
      <span className="text-[13px] text-foreground">{label}</span>
      <span className="flex items-center gap-2 text-muted">
        {preview}
        <CaretRight className="text-subtle" size={12} weight="bold" />
      </span>
    </button>
  );
}

function MainPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { preferences, update } = useSettings();
  const theme = THEME_OPTIONS.find((option) => option.id === preferences.accent);
  const font = FONT_OPTIONS.find((option) => option.id === preferences.font);
  const pack = SOUND_PACK_OPTIONS.find((option) => option.id === preferences.soundPack);
  const mistake = MISTAKE_SOUND_OPTIONS.find((option) => option.id === preferences.mistakeSound);
  const audioOff = !preferences.soundEnabled;

  const toggleFaah = (enabled: boolean) => {
    update({ faahMode: enabled });
    if (enabled && preferences.soundEnabled) {
      previewMistake(preferences.mistakeSound, preferences.volume);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Section title="Appearance">
        <Row label="Mode">
          <ModeSwitcher onChange={(mode) => update({ mode })} value={preferences.mode} />
        </Row>
        <SubpageRow
          label="Theme"
          onOpen={() => onNavigate("themes")}
          preview={
            <>
              {theme && <ThemeSwatch className="h-3.5 w-9 rounded-full" colors={theme.colors} />}
              <span className="text-[11px]">{theme?.label}</span>
            </>
          }
        />
        <SubpageRow
          label="Font"
          onOpen={() => onNavigate("fonts")}
          preview={
            <span className="text-[12px]" style={{ fontFamily: `var(${font?.variable})` }}>
              {font?.label}
            </span>
          }
        />
      </Section>

      <Section title="Sound">
        <Row hint="Keyboard and effect sounds" label="Audio">
          <Switch
            checked={preferences.soundEnabled}
            label="Audio"
            onChange={(soundEnabled) => update({ soundEnabled })}
          />
        </Row>
        <Row label="Volume">
          <VolumeSlider
            disabled={audioOff}
            onChange={(volume) => update({ volume })}
            value={preferences.volume}
          />
        </Row>
        <SubpageRow
          label="Sound pack"
          onOpen={() => onNavigate("sounds")}
          preview={<span className="text-[11px]">{pack?.label}</span>}
        />
        <Row hint="Plays a sound on every mistake" label="Faah mode">
          <Switch
            checked={preferences.faahMode}
            disabled={audioOff}
            label="Faah mode"
            onChange={toggleFaah}
          />
        </Row>
        <SubpageRow
          label="Mistake sound"
          onOpen={() => onNavigate("mistakes")}
          preview={<span className="text-[11px]">{mistake?.label}</span>}
        />
      </Section>

      <Section title="Gameplay">
        <Row hint="Mechanical keyboard below the test" label="Show keyboard">
          <Switch
            checked={preferences.showKeyboard}
            label="Show keyboard"
            onChange={(showKeyboard) => update({ showKeyboard })}
          />
        </Row>
        <Row hint="WPM and accuracy while you type" label="Live stats">
          <Switch
            checked={preferences.liveStats}
            label="Live stats"
            onChange={(liveStats) => update({ liveStats })}
          />
        </Row>
      </Section>
    </div>
  );
}

function SubPage({ page }: { page: Exclude<Page, "main"> }) {
  const { preferences, update } = useSettings();
  if (page === "themes") {
    return <ThemeGrid active={preferences.accent} onSelect={(accent) => update({ accent })} />;
  }
  if (page === "fonts") {
    return <FontList active={preferences.font} onSelect={(font) => update({ font })} />;
  }
  if (page === "mistakes") {
    return (
      <MistakeSoundList
        active={preferences.mistakeSound}
        onSelect={(mistakeSound) => update({ mistakeSound })}
        volume={preferences.soundEnabled ? preferences.volume : 0}
      />
    );
  }
  return (
    <SoundPackList
      active={preferences.soundPack}
      onSelect={(soundPack) => update({ soundPack })}
      volume={preferences.soundEnabled ? preferences.volume : 0}
    />
  );
}

function Footer({ shortcut }: { shortcut: string }) {
  const { storage, syncError } = useSettings();
  const { icon: Icon, text } = STORAGE_COPY[storage];
  return (
    <div className="flex items-center justify-between gap-3 border-border border-t px-5 py-3.5 text-[11px] text-subtle">
      {syncError ? (
        <span className="flex items-center gap-1.5 text-danger">
          <WarningCircle size={14} weight="duotone" />
          {syncError}
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <Icon size={14} weight="duotone" />
          {text}
        </span>
      )}
      <kbd className="shrink-0 rounded-md bg-surface-strong px-1.5 py-0.5 font-mono text-[10px] text-muted">
        {shortcut}
      </kbd>
    </div>
  );
}

export function SettingsPanel({
  onOpenChange,
  open,
  shortcut,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  shortcut: string;
}) {
  const desktop = useMediaQuery("(min-width: 640px)", true);
  const [page, setPage] = useState<Page>("main");
  const panelRef = useRef<HTMLDivElement>(null);
  const direction = page === "main" ? -1 : 1;

  useEffect(() => {
    if (!open) {
      setPage("main");
      return;
    }
    panelRef.current?.focus();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      if (page === "main") {
        onOpenChange(false);
      } else {
        setPage("main");
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, page, onOpenChange]);

  const hidden = desktop ? { x: 40, opacity: 0 } : { y: 60, opacity: 0 };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            animate={{ opacity: 1 }}
            aria-hidden
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] dark:bg-black/40"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            animate={{ x: 0, y: 0, opacity: 1 }}
            aria-label={TITLES[page]}
            aria-modal="true"
            className="fixed inset-x-2 bottom-2 z-50 flex max-h-[88dvh] flex-col overflow-hidden rounded-3xl border border-border bg-elevated shadow-[0_30px_80px_-20px_rgb(0_0_0/0.35)] outline-none sm:inset-x-auto sm:top-3 sm:right-3 sm:bottom-3 sm:max-h-none sm:w-[400px]"
            exit={hidden}
            initial={hidden}
            ref={panelRef}
            role="dialog"
            tabIndex={-1}
            transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
          >
            <header className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
              <div className="flex min-w-0 items-center gap-1">
                {page !== "main" && (
                  <button
                    aria-label="Back"
                    className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
                    onClick={() => setPage("main")}
                    type="button"
                  >
                    <CaretLeft size={15} weight="bold" />
                  </button>
                )}
                <h2 className="px-1 font-semibold text-[15px] text-foreground">{TITLES[page]}</h2>
              </div>
              <button
                aria-label="Close settings"
                className="flex size-8 items-center justify-center rounded-full bg-surface text-muted transition-colors hover:bg-surface-strong hover:text-foreground"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                <X size={14} weight="bold" />
              </button>
            </header>

            <div className="relative flex-1 overflow-y-auto overflow-x-hidden px-4 pb-5">
              <AnimatePresence custom={direction} initial={false} mode="popLayout">
                <motion.div
                  animate={{ x: 0, opacity: 1 }}
                  custom={direction}
                  exit={{ x: direction * -40, opacity: 0 }}
                  initial={{ x: direction * 40, opacity: 0 }}
                  key={page}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                >
                  {page === "main" ? <MainPage onNavigate={setPage} /> : <SubPage page={page} />}
                </motion.div>
              </AnimatePresence>
            </div>

            <Footer shortcut={shortcut} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
