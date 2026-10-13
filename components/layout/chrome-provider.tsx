"use client";

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { readConsent } from "@/lib/client/consent";

const SOUND_KEY = "kc-sound";

interface ChromeContextValue {
  setSoundEnabled: (enabled: boolean) => void;
  setTypingActive: (active: boolean) => void;
  soundEnabled: boolean;
  typingActive: boolean;
}

const ChromeContext = createContext<ChromeContextValue | null>(null);

export function ChromeProvider({ children }: { children: ReactNode }) {
  const [typingActive, setTypingActive] = useState(false);
  const [soundEnabled, setSoundState] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(SOUND_KEY) === "off") {
        setSoundState(false);
      }
    } catch {
      return;
    }
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundState(enabled);
    try {
      if (readConsent() === "all") {
        localStorage.setItem(SOUND_KEY, enabled ? "on" : "off");
      }
    } catch {
      return;
    }
  }, []);

  const value = useMemo(
    () => ({ typingActive, setTypingActive, soundEnabled, setSoundEnabled }),
    [typingActive, soundEnabled, setSoundEnabled],
  );

  return <ChromeContext value={value}>{children}</ChromeContext>;
}

export function useChrome() {
  const context = use(ChromeContext);
  if (!context) {
    throw new Error("useChrome must be used inside ChromeProvider");
  }
  return context;
}
