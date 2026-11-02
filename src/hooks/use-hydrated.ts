"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * `false` during SSR and the hydration pass, `true` afterwards.
 * Use it before rendering client-only preference state (theme selection,
 * toggles) so the server markup and first client render always agree.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
