"use client";

import { CircleNotch, Trash, UploadSimple } from "@phosphor-icons/react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: 56, icon: 12, spinner: 16, label: "text-[7px]", showLabel: false },
  default: { box: 80, icon: 11, spinner: 20, label: "text-[8px]", showLabel: true },
  lg: { box: 96, icon: 12, spinner: 22, label: "text-[9px]", showLabel: true },
} as const;

export interface ImageUploadProps {
  accept?: string;
  className?: string;
  disabled?: boolean;
  emptyHint?: string;
  filledHint?: string;
  loading?: boolean;
  name: string;
  onRemove?: () => void;
  onSelect: (file: File) => void;
  size?: keyof typeof SIZES;
  src: string | null;
}

const overlayButton =
  "flex flex-1 flex-col items-center justify-center gap-0.5 bg-black/55 font-semibold text-white uppercase leading-none tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export function ImageUpload({
  accept = "image/png,image/jpeg,image/webp,image/gif",
  className,
  disabled = false,
  emptyHint = "Click to upload a photo",
  filledHint = "Hover to change or remove",
  loading = false,
  name,
  onRemove,
  onSelect,
  size = "default",
  src,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef("");
  const [revealed, setRevealed] = useState(false);
  const dims = SIZES[size];
  const interactive = !(disabled || loading);
  const canRemove = Boolean(src && onRemove);

  useEffect(() => {
    if (!revealed) {
      return;
    }
    const hide = (event: PointerEvent) => {
      if (!frameRef.current?.contains(event.target as Node)) {
        setRevealed(false);
      }
    };
    document.addEventListener("pointerdown", hide);
    return () => document.removeEventListener("pointerdown", hide);
  }, [revealed]);

  const pick = () => {
    if (interactive) {
      setRevealed(false);
      inputRef.current?.click();
    }
  };

  const remove = () => {
    const touch = pointerRef.current === "touch" || pointerRef.current === "pen";
    if (touch && !revealed) {
      setRevealed(true);
      return;
    }
    pointerRef.current = "";
    setRevealed(false);
    onRemove?.();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      onSelect(file);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className="group relative shrink-0 overflow-hidden rounded-full ring-offset-2 ring-offset-elevated focus-within:ring-2 focus-within:ring-primary/60"
        ref={frameRef}
        style={{ width: dims.box, height: dims.box }}
      >
        <Avatar className="size-full" name={name} size={dims.box} src={src} />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <CircleNotch className="animate-spin text-white" size={dims.spinner} weight="bold" />
          </div>
        )}

        {!loading && (
          <div
            className={cn(
              "absolute inset-0 flex flex-col opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100",
              revealed && "opacity-100",
            )}
            data-revealed={revealed || undefined}
          >
            {canRemove && (
              <button
                aria-label="Remove photo"
                className={cn(overlayButton, dims.label, "justify-end pb-[9%] hover:bg-danger/85")}
                disabled={!interactive}
                onClick={remove}
                onPointerDown={(event) => {
                  pointerRef.current = event.pointerType;
                }}
                title="Remove photo"
                type="button"
              >
                <Trash size={dims.icon} weight="bold" />
                {dims.showLabel && "remove"}
              </button>
            )}
            <button
              aria-label={src ? "Change photo" : emptyHint}
              className={cn(
                overlayButton,
                dims.label,
                canRemove && "justify-start pt-[9%]",
                "hover:bg-primary/85",
              )}
              disabled={!interactive}
              onClick={pick}
              title={src ? "Change photo" : emptyHint}
              type="button"
            >
              <UploadSimple size={dims.icon} weight="bold" />
              {dims.showLabel && (src ? "change" : "upload")}
            </button>
          </div>
        )}
      </div>

      <span className="sr-only">{src ? filledHint : emptyHint}</span>

      <input
        accept={accept}
        aria-label="Photo file"
        className="hidden"
        disabled={!interactive}
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}
