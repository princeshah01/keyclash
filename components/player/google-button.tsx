"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { useState } from "react";
import { usePlayer } from "@/components/player/player-provider";
import { buttonClass } from "@/components/ui/button";
import { GoogleMark } from "@/components/ui/marks";
import { cn } from "@/lib/utils";

export function GoogleButton({
  className,
  label = "Continue with Google",
}: {
  className?: string;
  label?: string;
}) {
  const { signInWithGoogle } = usePlayer();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setPending(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Google sign-in failed");
      setPending(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <button
        className={cn(buttonClass("surface"), "w-full ring-1 ring-border")}
        disabled={pending}
        onClick={handleClick}
        type="button"
      >
        {pending ? (
          <CircleNotch className="animate-spin" size={16} weight="bold" />
        ) : (
          <GoogleMark className="size-4" />
        )}
        {label}
      </button>
      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
}
