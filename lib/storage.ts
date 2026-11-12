"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * Practice progress lives in the browser only (no accounts, no database). Reads and writes never throw: in a private
 * window, or with site data blocked, it falls back to memory for the life of the page.
 */
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

/** `fallback` must be a constant (a module-level value), because it is returned as is until something is saved. */
export function useStored<T>(key: string, fallback: T): [T, (value: T) => void] {
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null);
  const value = useMemo(() => {
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);
  const set = useCallback(
    (next: T) => {
      const text = JSON.stringify(next);
      memory.set(key, text);
      try {
        window.localStorage.setItem(key, text);
      } catch {
        /* blocked: the memory copy above carries it */
      }
      listeners.forEach((l) => l());
    },
    [key],
  );
  return [value, set];
}
