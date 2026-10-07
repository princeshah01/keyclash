"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

const HUES = [172, 28, 250, 320, 85, 200, 140, 10];

function hueFor(seed: string) {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return HUES[hash % HUES.length];
}

interface AvatarProps {
  className?: string;
  name: string;
  size?: number;
  src: string | null;
}

export function Avatar({ className, name, size = 28, src }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src !== null && failedSrc !== src;
  const hue = hueFor(name);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold uppercase",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.4)),
        background: `oklch(0.85 0.07 ${hue} / 0.55)`,
        color: `oklch(0.38 0.08 ${hue})`,
      }}
    >
      {showImage ? (
        <Image
          alt=""
          className="size-full object-cover"
          height={size}
          onError={() => setFailedSrc(src)}
          referrerPolicy="no-referrer"
          src={src}
          unoptimized
          width={size}
        />
      ) : (
        name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 1) || "?"
      )}
    </span>
  );
}
