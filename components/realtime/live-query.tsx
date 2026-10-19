"use client";

import type { SealedLiveQuery } from "@neon/realtime/client";
import { useLiveQuery } from "@neon/realtime-react";
import { type ReactNode, useEffect } from "react";
import { useSealedQuery } from "@/lib/client/live";

export type LiveStatus = "loading" | "live" | "updating" | "error";

export interface LiveView<Row> {
  error: string | null;
  rows: readonly Row[] | undefined;
  status: LiveStatus;
}

type Render<Row> = (view: LiveView<Row>) => ReactNode;

function Subscription<Row>({
  children,
  refreshQuery,
  retry,
  sealed,
}: {
  children: Render<Row>;
  refreshQuery: () => Promise<SealedLiveQuery<Row>>;
  retry: () => void;
  sealed: SealedLiveQuery<Row>;
}) {
  const { data, status, error } = useLiveQuery(sealed, { refreshQuery });

  useEffect(() => {
    if (status !== "error") {
      return;
    }
    const timer = setTimeout(retry, 1500);
    return () => clearTimeout(timer);
  }, [status, retry]);

  let view: LiveStatus = "live";
  if (status === "error") {
    view = "error";
  } else if (data === undefined) {
    view = "loading";
  } else if (status !== "live") {
    view = "updating";
  }

  return children({
    rows: data,
    status: view,
    error: status === "error" ? (error?.message ?? "Live updates stopped") : null,
  });
}

export function LiveQuery<Row>({
  body,
  children,
  endpoint,
}: {
  body: unknown;
  children: Render<Row>;
  endpoint: string | null;
}) {
  const { sealed, error, refreshQuery, retry } = useSealedQuery<Row>(endpoint, body);

  if (sealed) {
    return (
      <Subscription<Row> refreshQuery={refreshQuery} retry={retry} sealed={sealed}>
        {children}
      </Subscription>
    );
  }
  return children({ rows: undefined, status: error ? "error" : "loading", error: error ?? null });
}
