"use client";

import { useCallback, useEffect, useState } from "react";
import type { RenewalsResponse } from "@/lib/types";

interface State {
  /** Identifies the request (attempt + query) that produced this state. */
  requestKey: string | null;
  data: RenewalsResponse | null;
  error: string | null;
}

export interface RenewalsResult {
  /** Latest successful response; kept while a newer request is in flight so the UI doesn't blank out. */
  data: RenewalsResponse | null;
  /** True while the response for the current query has not arrived yet. */
  isFetching: boolean;
  error: string | null;
  retry: () => void;
}

/** Fetches /api/renewals for a query string; cancels superseded requests. */
export function useRenewals(query: string): RenewalsResult {
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${attempt}|${query}`;
  const [state, setState] = useState<State>({
    requestKey: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/renewals${query ? `?${query}` : ""}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`The server answered ${res.status}`);
        return res.json() as Promise<RenewalsResponse>;
      })
      .then((data) => setState({ requestKey, data, error: null }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setState((prev) => ({ ...prev, requestKey, error: message }));
      });
    return () => controller.abort();
  }, [query, requestKey]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const settled = state.requestKey === requestKey;
  return {
    data: state.data,
    isFetching: !settled,
    error: settled ? state.error : null,
    retry,
  };
}
