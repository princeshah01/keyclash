"use client";

import {
  type LiveQueryError,
  type LiveQuerySnapshot,
  type MaterializedLiveQuerySubscription,
  QueryRefreshController,
  type RealtimeClient,
  type SealedLiveQuery,
} from "@neon/realtime/client";
import { api } from "./api";

type Listener = () => void;

class WarmQueryError extends Error implements LiveQueryError {
  readonly code: string;
  readonly retryable = true;
  readonly cause?: unknown;

  constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.name = "LiveQueryError";
    this.code = code;
    this.cause = cause;
  }
}

const connectingSnapshot = Object.freeze({
  status: "connecting",
  error: undefined,
  data: undefined,
}) as LiveQuerySnapshot<never>;

/**
 * One sealed live query kept open for the page session.
 * React listeners attach/detach freely; the wire subscription is not closed
 * until a full refresh (module state resets) or {@link WarmLiveEntry.dispose}.
 */
export class WarmLiveEntry<Row> {
  private readonly listeners = new Set<Listener>();
  private snapshot: LiveQuerySnapshot<Row> = connectingSnapshot as LiveQuerySnapshot<Row>;
  private subscription?: MaterializedLiveQuerySubscription<Row>;
  private queryRefresh?: QueryRefreshController<Row>;
  private detachForwarders?: () => void;
  private openGeneration = 0;
  private opening?: Promise<void>;

  constructor(
    private readonly client: RealtimeClient,
    private readonly endpoint: string,
    private readonly bodyJson: string,
  ) {}

  readonly subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    if (!this.subscription && !this.opening) {
      void this.ensureOpen();
    }
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): LiveQuerySnapshot<Row> => this.snapshot;

  readonly retry = () => {
    void this.ensureOpen(true);
  };

  dispose() {
    this.openGeneration += 1;
    this.teardownSubscription();
    this.listeners.clear();
    this.snapshot = connectingSnapshot as LiveQuerySnapshot<Row>;
  }

  private notify() {
    for (const listener of [...this.listeners]) {
      try {
        listener();
      } catch {
        /* ignore listener errors */
      }
    }
  }

  private setSnapshot(next: LiveQuerySnapshot<Row>) {
    this.snapshot = next;
    this.notify();
  }

  private async ensureOpen(force = false) {
    if (this.opening) {
      await this.opening;
      if (!force || this.subscription) {
        return;
      }
    }
    if (this.subscription && !force) {
      return;
    }

    const generation = ++this.openGeneration;
    this.teardownSubscription();
    this.setSnapshot({
      status: "connecting",
      error: undefined,
      data: this.snapshot.data,
    });

    this.opening = (async () => {
      try {
        const sealed = await api<SealedLiveQuery<Row>>(this.endpoint, {
          method: "POST",
          body: this.bodyJson,
        });
        if (generation !== this.openGeneration) {
          return;
        }
        this.attach(sealed);
      } catch (error) {
        if (generation !== this.openGeneration) {
          return;
        }
        this.setSnapshot({
          status: "error",
          error: new WarmQueryError(
            error instanceof Error ? error.message : "Could not open live updates",
            "SEAL_FAILED",
            error,
          ),
          data: this.snapshot.data,
        });
      }
    })();

    try {
      await this.opening;
    } finally {
      if (generation === this.openGeneration) {
        this.opening = undefined;
      }
    }
  }

  private attach(sealed: SealedLiveQuery<Row>) {
    const refreshQuery = () =>
      api<SealedLiveQuery<Row>>(this.endpoint, {
        method: "POST",
        body: this.bodyJson,
      });

    const queryRefresh = new QueryRefreshController<Row>({
      query: sealed,
      renewSubscription: (replacement) =>
        this.subscription?.renew(replacement) ?? Promise.resolve(),
      onSubscriptionRenewed: () => {
        if (this.subscription) {
          this.setSnapshot(this.subscription.getSnapshot());
        }
      },
      onRefreshExhausted: (error) => {
        this.setSnapshot({
          status: "error",
          error: new WarmQueryError("Live query refresh failed", "QUERY_REFRESH_FAILED", error),
          data: this.subscription?.getSnapshot().data,
        });
      },
    });
    queryRefresh.setRefreshCallback(refreshQuery);

    const subscription = this.client.subscribe<Row>(queryRefresh.currentQuery());
    this.subscription = subscription;
    this.queryRefresh = queryRefresh;
    queryRefresh.setSubscription(subscription);
    this.setSnapshot(subscription.getSnapshot());

    const stopChange = subscription.onChange((snapshot) => this.setSnapshot(snapshot));
    this.detachForwarders = () => {
      stopChange();
    };
    queryRefresh.start();
  }

  private teardownSubscription() {
    this.queryRefresh?.stop();
    this.detachForwarders?.();
    this.detachForwarders = undefined;
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.queryRefresh?.setSubscription(undefined);
    this.queryRefresh = undefined;
  }
}

const registries = new WeakMap<RealtimeClient, Map<string, WarmLiveEntry<unknown>>>();

export function getWarmLiveEntry<Row>(
  client: RealtimeClient,
  endpoint: string,
  bodyJson: string,
): WarmLiveEntry<Row> {
  let byKey = registries.get(client);
  if (!byKey) {
    byKey = new Map();
    registries.set(client, byKey);
  }
  const key = `${endpoint}|${bodyJson}`;
  let entry = byKey.get(key);
  if (!entry) {
    entry = new WarmLiveEntry<Row>(client, endpoint, bodyJson) as WarmLiveEntry<unknown>;
    byKey.set(key, entry);
  }
  return entry as WarmLiveEntry<Row>;
}
