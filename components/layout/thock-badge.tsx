"use client";

import { LiveQuery } from "@/components/realtime/live-query";
import { AnimatedNumber } from "@/components/ui/animated-number";
import type { ThockTotalRow } from "@/lib/client/live";

/** Site-wide thock total. Seals once on load; the subscription stays warm for the page session. */
export function ThockBadge() {
  return (
    <span
      className="hidden items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] text-muted sm:inline-flex"
      title="Total key thocks across every test"
    >
      <span className="font-mono font-medium text-foreground tabular-nums">
        <LiveQuery<ThockTotalRow> body={{}} endpoint="/api/thocks/live">
          {({ rows }) => {
            const total = rows?.[0]?.total;
            return total === undefined ? "–" : <AnimatedNumber value={total} />;
          }}
        </LiveQuery>
      </span>
      <span className="text-subtle">thocks and counting</span>
    </span>
  );
}
