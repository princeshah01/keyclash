"use client";

import { Check, CircleNotch, PencilSimple, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { usePlayer } from "@/components/player/player-provider";
import { ApiError } from "@/lib/client/api";
import { cn } from "@/lib/utils";

export function NameEditor({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  const { player, rename } = usePlayer();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  if (!player) {
    return <div className={cn("h-9 w-40 animate-pulse rounded-lg bg-surface", className)} />;
  }

  const startEditing = () => {
    setDraft(player.name);
    setError(null);
    setEditing(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (draft.trim() === player.name) {
      setEditing(false);
      return;
    }
    setPending(true);
    setError(null);
    try {
      await rename(draft);
      setEditing(false);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not update your name");
    } finally {
      setPending(false);
    }
  };

  const large = size === "lg";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        {editing ? (
          <motion.form
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1"
            exit={{ opacity: 0, y: -4 }}
            initial={{ opacity: 0, y: 4 }}
            key="form"
            onSubmit={submit}
            transition={{ duration: 0.15 }}
          >
            <input
              aria-label="Display name"
              autoCapitalize="none"
              autoComplete="off"
              className={cn(
                "min-w-0 flex-1 rounded-lg bg-surface px-2.5 font-medium text-foreground outline-none ring-1 ring-transparent transition focus:ring-primary/50",
                large ? "h-10 text-lg" : "h-8 text-sm",
              )}
              maxLength={20}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => event.key === "Escape" && setEditing(false)}
              ref={inputRef}
              spellCheck={false}
              value={draft}
            />
            <button
              aria-label="Save name"
              className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:brightness-105 disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? (
                <CircleNotch className="animate-spin" size={14} weight="bold" />
              ) : (
                <Check size={14} weight="bold" />
              )}
            </button>
            <button
              aria-label="Cancel"
              className="flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-strong hover:text-foreground"
              onClick={() => setEditing(false)}
              type="button"
            >
              <X size={14} weight="bold" />
            </button>
          </motion.form>
        ) : (
          <motion.button
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "group flex min-w-0 items-center gap-2 rounded-lg text-left font-semibold text-foreground",
              large ? "text-2xl" : "text-sm",
            )}
            exit={{ opacity: 0, y: 4 }}
            initial={{ opacity: 0, y: -4 }}
            key="label"
            onClick={startEditing}
            title="Edit name"
            transition={{ duration: 0.15 }}
            type="button"
          >
            <span className="truncate">{player.name}</span>
            <PencilSimple
              className="shrink-0 text-subtle transition-colors group-hover:text-primary"
              size={large ? 18 : 13}
              weight="bold"
            />
          </motion.button>
        )}
      </AnimatePresence>
      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
}
