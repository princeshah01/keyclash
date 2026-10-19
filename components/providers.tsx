"use client";

import type { ReactNode } from "react";
import { ConsentProvider } from "@/components/consent/consent-provider";
import { ChromeProvider } from "@/components/layout/chrome-provider";
import { PlayerProvider } from "@/components/player/player-provider";
import { RealtimeRoot } from "@/components/realtime/realtime-root";
import { RoomsProvider } from "@/components/rooms/rooms-provider";
import { SettingsProvider } from "@/components/settings/settings-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <RealtimeRoot>
      <ConsentProvider>
        <PlayerProvider>
          <SettingsProvider>
            <RoomsProvider>
              <ChromeProvider>{children}</ChromeProvider>
            </RoomsProvider>
          </SettingsProvider>
        </PlayerProvider>
      </ConsentProvider>
    </RealtimeRoot>
  );
}
