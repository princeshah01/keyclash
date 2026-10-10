"use client";

import { At, CircleNotch, Hash, SignOut } from "@phosphor-icons/react";
import { motion } from "motion/react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { GoogleButton } from "@/components/player/google-button";
import { NameEditor } from "@/components/player/name-editor";
import { usePlayer } from "@/components/player/player-provider";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { Button, buttonClass } from "@/components/ui/button";
import { api } from "@/lib/client/api";
import type { PlayerStats } from "@/lib/client/types";
import { RANKED_DETAILS, RANKED_MODES } from "@/lib/typing/options";
import { cn, formatDuration, timeAgo } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

function Section({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3"
      initial={{ opacity: 0, y: 12 }}
      transition={{ delay, duration: 0.5, ease }}
    >
      <h2 className="px-1 text-[11px] text-subtle uppercase tracking-[0.18em]">{title}</h2>
      {children}
    </motion.section>
  );
}

function Metric({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-surface px-4 py-3.5">
      <span className="text-[10px] text-subtle uppercase tracking-[0.18em]">{label}</span>
      <span
        className={cn(
          "font-mono font-semibold text-2xl",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function AccountCard() {
  const { player, signOut } = usePlayer();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 rounded-3xl bg-surface p-6 sm:flex-row sm:items-center sm:p-8"
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.5, ease }}
    >
      <AvatarUploader />
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:items-start">
        <NameEditor className="max-w-full" size="lg" />
        <p className="text-muted text-sm">
          {player?.isGuest ? "Guest profile · stored in this browser" : player?.email}
        </p>
      </div>
      <div className="w-full sm:w-64">
        {player?.isGuest ? (
          <GoogleButton label="Save progress with Google" />
        ) : (
          <Button
            className="w-full"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              await signOut().finally(() => setSigningOut(false));
            }}
            variant="ghost"
          >
            {signingOut ? (
              <CircleNotch className="animate-spin" size={16} weight="bold" />
            ) : (
              <SignOut size={16} weight="duotone" />
            )}
            Sign out
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function ProfileView() {
  const { player } = usePlayer();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playerId = player?.id;

  useEffect(() => {
    if (!playerId) {
      return;
    }
    setStats(null);
    setError(null);
    api<PlayerStats>("/api/me/stats")
      .then(setStats)
      .catch((caught: unknown) =>
        setError(caught instanceof Error ? caught.message : "Could not load stats"),
      );
  }, [playerId]);

  const bestFor = (mode: string, detail: string) =>
    stats?.bests.find((best) => best.mode === mode && best.modeDetail === detail);

  return (
    <div className="flex w-full max-w-4xl flex-col gap-10">
      <AccountCard />

      {error && <p className="text-center text-danger text-sm">{error}</p>}

      <Section delay={0.08} title="overview">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Metric label="tests" value={stats ? stats.totals.tests : "–"} />
          <Metric
            label="time typing"
            value={stats ? formatDuration(stats.totals.secondsTyped) : "–"}
          />
          <Metric accent label="best wpm" value={stats ? stats.totals.bestWpm : "–"} />
          <Metric label="avg wpm" value={stats ? stats.totals.averageWpm : "–"} />
          <Metric label="avg acc" value={stats ? `${stats.totals.averageAccuracy}%` : "–"} />
        </div>
      </Section>

      <Section delay={0.16} title="personal bests">
        <div className="grid gap-2 sm:grid-cols-2">
          {RANKED_MODES.map((mode) => (
            <div className="grid grid-cols-4 gap-1 rounded-2xl bg-surface p-2" key={mode}>
              {RANKED_DETAILS[mode].map((detail) => {
                const best = bestFor(mode, detail);
                return (
                  <Link
                    className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-3 transition-colors hover:bg-surface-strong"
                    href={`/leaderboard?mode=${mode}&detail=${detail}`}
                    key={detail}
                  >
                    <span className="text-[10px] text-subtle">
                      {mode} {detail}
                    </span>
                    <span
                      className={cn(
                        "font-mono font-semibold text-xl",
                        best ? "text-foreground" : "text-faint",
                      )}
                    >
                      {best?.wpm ?? "–"}
                    </span>
                    <span className="font-mono text-[10px] text-subtle">
                      {best ? `${best.accuracy}%` : " "}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </Section>

      <Section delay={0.24} title="recent tests">
        {!stats && !error ? (
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="h-12 animate-pulse rounded-2xl bg-surface" key={index} />
            ))}
          </div>
        ) : stats && stats.recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface px-6 py-12 text-center">
            <p className="text-muted text-sm">No tests yet. Your results will show up here.</p>
            <Link className={buttonClass("primary", "sm")} href="/">
              take a test
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col">
            <li className="grid grid-cols-[1fr_4rem_4rem] gap-3 px-3 pb-2 text-[10px] text-subtle uppercase tracking-[0.18em] sm:grid-cols-[1fr_4.5rem_4.5rem_4.5rem_4.5rem_7rem]">
              <span>test</span>
              <span className="text-right">wpm</span>
              <span className="text-right">acc</span>
              <span className="hidden text-right sm:block">raw</span>
              <span className="hidden text-right sm:block">cons</span>
              <span className="hidden text-right sm:block">when</span>
            </li>
            {stats?.recent.map((result) => (
              <li
                className="grid grid-cols-[1fr_4rem_4rem] items-center gap-3 rounded-xl px-3 py-2.5 text-sm odd:bg-surface sm:grid-cols-[1fr_4.5rem_4.5rem_4.5rem_4.5rem_7rem]"
                key={result.id}
              >
                <span className="flex items-center gap-1.5 text-muted">
                  {`${result.mode} ${result.modeDetail}`.trim()}
                  {result.punctuation && <At className="text-subtle" size={12} weight="bold" />}
                  {result.numbers && <Hash className="text-subtle" size={12} weight="bold" />}
                </span>
                <span className="text-right font-mono font-semibold text-foreground">
                  {result.wpm}
                </span>
                <span className="text-right font-mono text-muted">{result.accuracy}%</span>
                <span className="hidden text-right font-mono text-subtle sm:block">
                  {result.raw}
                </span>
                <span className="hidden text-right font-mono text-subtle sm:block">
                  {result.consistency}%
                </span>
                <span className="hidden text-right text-subtle text-xs sm:block">
                  {timeAgo(result.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
