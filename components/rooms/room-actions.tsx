"use client";

import { Check, CircleNotch, LinkSimple, Plus } from "@phosphor-icons/react";
import { type FormEvent, useState } from "react";
import { inviteUrl, useRooms } from "@/components/rooms/rooms-provider";
import { buttonClass } from "@/components/ui/button";
import { ApiError } from "@/lib/client/api";
import { cn } from "@/lib/utils";

export function InviteButton({
  className,
  code,
  name,
  variant = "soft",
}: {
  className?: string;
  code: string;
  name: string;
  variant?: "soft" | "icon";
}) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = inviteUrl(code);
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ title: `Join ${name} on keyclash`, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  if (variant === "icon") {
    return (
      <button
        aria-label="Copy invite link"
        className={cn(
          "flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-strong hover:text-foreground",
          className,
        )}
        onClick={share}
        title={copied ? "Copied!" : "Copy invite link"}
        type="button"
      >
        {copied ? (
          <Check className="text-primary" size={14} weight="bold" />
        ) : (
          <LinkSimple size={14} weight="bold" />
        )}
      </button>
    );
  }

  return (
    <button className={cn(buttonClass("soft", "sm"), className)} onClick={share} type="button">
      {copied ? <Check size={14} weight="bold" /> : <LinkSimple size={14} weight="bold" />}
      {copied ? "link copied" : "invite"}
    </button>
  );
}

export function CreateRoomForm({ onCreated }: { onCreated?: (code: string) => void }) {
  const { create } = useRooms();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const code = await create(name);
      setName("");
      onCreated?.(code);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not create the room");
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="flex flex-col gap-1.5" onSubmit={submit}>
      <div className="flex items-center gap-1.5">
        <input
          aria-label="Room name"
          className="h-9 min-w-0 flex-1 rounded-xl bg-surface px-3 text-foreground text-sm outline-none ring-1 ring-transparent transition placeholder:text-subtle focus:ring-primary/50"
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
          placeholder="New room name"
          value={name}
        />
        <button
          aria-label="Create room"
          className={cn(buttonClass("primary", "sm"), "h-9 px-3")}
          disabled={pending || name.trim().length < 2}
          type="submit"
        >
          {pending ? (
            <CircleNotch className="animate-spin" size={14} weight="bold" />
          ) : (
            <Plus size={14} weight="bold" />
          )}
        </button>
      </div>
      {error && <p className="px-1 text-danger text-xs">{error}</p>}
    </form>
  );
}
