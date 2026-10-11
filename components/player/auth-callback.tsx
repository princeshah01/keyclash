"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { usePlayer } from "@/components/player/player-provider";

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = usePlayer();
  const handledRef = useRef(false);
  const next = safeNext(searchParams.get("next"));

  useEffect(() => {
    if (handledRef.current || searchParams.has("neon_auth_session_verifier")) {
      return;
    }
    handledRef.current = true;
    void refresh().then(() => router.replace(next));
  }, [next, refresh, router, searchParams]);

  return (
    <div className="flex items-center gap-3 text-muted text-sm">
      <CircleNotch className="animate-spin text-primary" size={18} weight="bold" />
      signing you in…
    </div>
  );
}
