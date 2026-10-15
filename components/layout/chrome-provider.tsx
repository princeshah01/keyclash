"use client";

import { createContext, type ReactNode, use, useMemo, useState } from "react";

interface ChromeContextValue {
  setTypingActive: (active: boolean) => void;
  typingActive: boolean;
}

const ChromeContext = createContext<ChromeContextValue | null>(null);

export function ChromeProvider({ children }: { children: ReactNode }) {
  const [typingActive, setTypingActive] = useState(false);
  const value = useMemo(() => ({ typingActive, setTypingActive }), [typingActive]);
  return <ChromeContext value={value}>{children}</ChromeContext>;
}

export function useChrome() {
  const context = use(ChromeContext);
  if (!context) {
    throw new Error("useChrome must be used inside ChromeProvider");
  }
  return context;
}
