export const CONSENT_VALUES = ["all", "essential"] as const;
export type Consent = (typeof CONSENT_VALUES)[number];

export const CONSENT_COOKIE = "kc_consent";

export function readConsent(): Consent | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=(all|essential)`));
  return (match?.[1] as Consent | undefined) ?? null;
}
