"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { ConsentProvider } from "@/components/consent/consent-provider";
import { ChromeProvider } from "@/components/layout/chrome-provider";
import { PlayerProvider } from "@/components/player/player-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
      <ConsentProvider>
        <PlayerProvider>
          <ChromeProvider>{children}</ChromeProvider>
        </PlayerProvider>
      </ConsentProvider>
    </ThemeProvider>
  );
}
