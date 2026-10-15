"use client";

import type { ReactNode } from "react";
import { ConsentProvider } from "@/components/consent/consent-provider";
import { ChromeProvider } from "@/components/layout/chrome-provider";
import { PlayerProvider } from "@/components/player/player-provider";
import { SettingsProvider } from "@/components/settings/settings-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConsentProvider>
      <PlayerProvider>
        <SettingsProvider>
          <ChromeProvider>{children}</ChromeProvider>
        </SettingsProvider>
      </PlayerProvider>
    </ConsentProvider>
  );
}
