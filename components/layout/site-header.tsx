"use client";

import { Keyboard, Trophy } from "@phosphor-icons/react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useChrome } from "@/components/layout/chrome-provider";
import { ThockBadge } from "@/components/layout/thock-badge";
import { AccountMenu } from "@/components/player/account-menu";
import { AudioButton } from "@/components/settings/audio-button";
import { SettingsButton } from "@/components/settings/settings-button";
import { LogoMark } from "@/components/ui/marks";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "type", icon: Keyboard },
  { href: "/leaderboard", label: "leaderboard", icon: Trophy },
] as const;

function NavPills({ pathname }: { pathname: string | null }) {
  return NAV.map(({ href, label, icon: Icon }) => {
    const active =
      pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));
    return (
      <Link
        className={cn(
          "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-[13px] transition-colors",
          active ? "text-primary" : "text-subtle hover:text-muted",
        )}
        href={href}
        key={href}
      >
        {active && (
          <motion.span
            className="absolute inset-0 rounded-full bg-primary-soft"
            layoutId="nav-pill"
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          />
        )}
        <Icon className="relative" size={15} weight="duotone" />
        <span className="relative">{label}</span>
      </Link>
    );
  });
}

function CurrentNavPills() {
  return <NavPills pathname={usePathname()} />;
}

export function SiteHeader() {
  const { typingActive } = useChrome();
  const [peek, setPeek] = useState(false);
  const peekTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(peekTimer.current), []);

  const handleMouseMove = () => {
    if (!typingActive) {
      return;
    }
    setPeek(true);
    clearTimeout(peekTimer.current);
    peekTimer.current = setTimeout(() => setPeek(false), 2500);
  };

  return (
    <motion.header
      animate={{ opacity: typingActive && !peek ? 0.12 : 1 }}
      className="sticky top-0 z-40 flex justify-center px-4 py-4 md:px-10 md:py-5"
      onMouseMove={handleMouseMove}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* Blur on a sibling layer — backdrop-filter on the header itself traps fixed menus (settings). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[color-mix(in_oklch,var(--page)_78%,transparent)] backdrop-blur-2xl"
      />
      <div className="relative flex w-full max-w-5xl items-center justify-between gap-3">
        <Link
          className="flex items-center gap-2 font-semibold text-foreground text-xl tracking-tight"
          href="/"
        >
          <LogoMark className="size-7 text-primary" />
          <span>
            key<span className="text-primary">clash</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <ThockBadge />
          <div className="hidden items-center rounded-full bg-surface p-1 sm:flex">
            <Suspense fallback={<NavPills pathname={null} />}>
              <CurrentNavPills />
            </Suspense>
          </div>
          <Link
            aria-label="Leaderboard"
            className="flex size-9 items-center justify-center rounded-full bg-surface text-muted sm:hidden"
            href="/leaderboard"
          >
            <Trophy size={16} weight="duotone" />
          </Link>
          <AudioButton />
          <SettingsButton />
          <AccountMenu />
        </nav>
      </div>
    </motion.header>
  );
}
