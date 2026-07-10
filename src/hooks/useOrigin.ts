"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * The current origin, via useSyncExternalStore so server and hydration render an
 * empty string (matching SSR) and the client then reports window.location.origin.
 * The idiomatic, hydration-safe way to read a browser value.
 */
export function useOrigin(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
}
