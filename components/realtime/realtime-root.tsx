"use client";

import { createRealtimeClient } from "@neon/realtime/client";
import { RealtimeProvider } from "@neon/realtime-react";
import { type ReactNode, useState } from "react";

function createBrowserClient() {
  if (typeof window === "undefined") {
    return null;
  }
  return createRealtimeClient({ url: process.env.NEXT_PUBLIC_NEON_REALTIME_URL ?? "" });
}

export function RealtimeRoot({ children }: { children: ReactNode }) {
  const [client] = useState(createBrowserClient);
  if (!client) {
    return children;
  }
  return <RealtimeProvider client={client}>{children}</RealtimeProvider>;
}
