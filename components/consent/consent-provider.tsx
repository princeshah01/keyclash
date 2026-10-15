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
import { api } from "@/lib/client/api";
import { type Consent, readConsent } from "@/lib/client/consent";
import { clearStoredOptions } from "@/lib/typing/options";

interface ConsentContextValue {
  consent: Consent | null;
  ready: boolean;
  setConsent: (value: Consent) => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsentState(readConsent());
    setReady(true);
  }, []);

  const setConsent = useCallback((value: Consent) => {
    void api("/api/consent", { method: "POST", body: JSON.stringify({ value }) });
    setConsentState(value);
    if (value === "essential") {
      clearStoredOptions();
    }
  }, []);

  const value = useMemo(() => ({ consent, ready, setConsent }), [consent, ready, setConsent]);

  return <ConsentContext value={value}>{children}</ConsentContext>;
}

export function useConsent() {
  const context = use(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used inside ConsentProvider");
  }
  return context;
}
