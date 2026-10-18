"use client";

import { useSyncExternalStore } from "react";

export type Platform = "mac" | "other";

const APPLE = /mac|iphone|ipad|ipod/i;

function detectPlatform(): Platform {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const source = nav.userAgentData?.platform || nav.platform || nav.userAgent;
  return APPLE.test(source) ? "mac" : "other";
}

function subscribe() {
  return () => undefined;
}

export function usePlatform(): Platform | null {
  return useSyncExternalStore(subscribe, detectPlatform, () => null);
}

export function shortcutLabel(platform: Platform | null) {
  return platform === "mac" ? "⌘K" : "Ctrl K";
}
