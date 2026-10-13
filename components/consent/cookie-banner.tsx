"use client";

import { CaretDown, Cookie } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useConsent } from "@/components/consent/consent-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COOKIES = [
  {
    name: "kc_player",
    kind: "essential",
    purpose: "Keeps your guest profile and scores tied to this browser.",
  },
  {
    name: "Neon Auth session",
    kind: "essential",
    purpose: "Keeps you signed in after you continue with Google.",
  },
  {
    name: "kc_consent",
    kind: "essential",
    purpose: "Remembers the choice you make here.",
  },
  {
    name: "kc-test-options · kc-sound",
    kind: "preferences",
    purpose: "Remembers your test settings and keyboard sound between visits.",
  },
] as const;

export function CookieBanner() {
  const { consent, ready, setConsent } = useConsent();
  const [expanded, setExpanded] = useState(false);

  return (
    <AnimatePresence>
      {ready && consent === null && (
        <motion.section
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[400px]"
          exit={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1], delay: 0.6 }}
        >
          <div className="rounded-3xl border border-border bg-elevated p-5 shadow-[0_24px_60px_-16px_rgb(0_0_0/0.3)]">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Cookie size={18} weight="duotone" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold text-foreground text-sm">We use a few cookies</h2>
                <p className="text-muted text-xs leading-relaxed">
                  An essential cookie gives you a guest profile so your scores can reach the
                  leaderboard. With your OK we&apos;ll also remember your test settings.
                </p>
              </div>
            </div>

            <button
              aria-expanded={expanded}
              className="mt-3 flex items-center gap-1 font-medium text-subtle text-xs transition-colors hover:text-muted"
              onClick={() => setExpanded((value) => !value)}
              type="button"
            >
              What we store
              <CaretDown
                className={cn("transition-transform", expanded && "rotate-180")}
                size={11}
                weight="bold"
              />
            </button>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.ul
                  animate={{ height: "auto", opacity: 1 }}
                  className="overflow-hidden"
                  exit={{ height: 0, opacity: 0 }}
                  initial={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                >
                  {COOKIES.map((cookie) => (
                    <li
                      className="mt-2 flex flex-col gap-0.5 rounded-xl bg-surface px-3 py-2"
                      key={cookie.name}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <code className="font-mono text-[11px] text-foreground">{cookie.name}</code>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 font-medium text-[9px] uppercase tracking-wider",
                            cookie.kind === "essential"
                              ? "bg-surface-strong text-muted"
                              : "bg-primary-soft text-primary",
                          )}
                        >
                          {cookie.kind}
                        </span>
                      </span>
                      <span className="text-[11px] text-subtle leading-snug">{cookie.purpose}</span>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button onClick={() => setConsent("essential")} size="md" variant="surface">
                Essential only
              </Button>
              <Button onClick={() => setConsent("all")} size="md" variant="primary">
                Accept all
              </Button>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
