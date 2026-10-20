"use client";

import { useRealtimeClient } from "@neon/realtime-react";
import { type ReactNode, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getWarmLiveEntry } from "@/lib/client/live-session";

export type LiveStatus = "loading" | "live" | "updating" | "error";

export interface LiveView<Row> {
  error: string | null;
  rows: readonly Row[] | undefined;
  status: LiveStatus;
}

type Render<Row> = (view: LiveView<Row>) => ReactNode;

const idleSnapshot = Object.freeze({
  status: "connecting" as const,
  error: undefined,
  data: undefined,
});

function WarmSubscription<Row>({
  bodyJson,
  children,
  endpoint,
}: {
  bodyJson: string;
  children: Render<Row>;
  endpoint: string;
}) {
  const client = useRealtimeClient();
  const entry = useMemo(
    () => getWarmLiveEntry<Row>(client, endpoint, bodyJson),
    [client, endpoint, bodyJson],
  );
  const snapshot = useSyncExternalStore(entry.subscribe, entry.getSnapshot, () => idleSnapshot);

  useEffect(() => {
    if (snapshot.status !== "error") {
      return;
    }
    const timer = setTimeout(entry.retry, 1500);
    return () => clearTimeout(timer);
  }, [snapshot.status, entry]);

  let view: LiveStatus = "live";
  if (snapshot.status === "error") {
    view = "error";
  } else if (snapshot.data === undefined) {
    view = "loading";
  } else if (snapshot.status !== "live") {
    view = "updating";
  }

  return children({
    rows: snapshot.data,
    status: view,
    error: snapshot.status === "error" ? (snapshot.error?.message ?? "Live updates stopped") : null,
  });
}

/**
 * Live rows for a sealed query. The underlying subscription stays warm for the
 * page session after this component unmounts (tab switches, navigation). A full
 * refresh clears the cache; the next mount seals again.
 */
export function LiveQuery<Row>({
  body,
  children,
  endpoint,
}: {
  body: unknown;
  children: Render<Row>;
  endpoint: string | null;
}) {
  const bodyJson = JSON.stringify(body ?? {});
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!endpoint || !ready) {
    return children({ rows: undefined, status: "loading", error: null });
  }

  return (
    <WarmSubscription<Row> bodyJson={bodyJson} endpoint={endpoint}>
      {children}
    </WarmSubscription>
  );
}
