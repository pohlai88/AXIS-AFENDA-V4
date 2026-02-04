import type { PersistOptions, StorageValue } from "zustand/middleware";

/**
 * Persistence utilities (client only).
 * - Keep persistence keys deterministic and versioned.
 * - Provide migration helpers for breaking changes.
 * - Support multiple storage backends.
 */

export type PersistVersioned = {
  /** Semantic version for store migrations */
  version: string;
};

/**
 * Generate a deterministic persist key.
 * Format: namespace:vVersion
 */
export function makePersistKey(namespace: string, version: string): string {
  return `${namespace}:v${version}`;
}

/**
 * Minimal persist config helper with versioning.
 */
export function makePersistOptions<TState extends PersistVersioned>(opts: {
  /** Store namespace */
  name: string;
  /** Semantic version */
  version: string;
  /** Partial state to persist (defaults to all) */
  partialize?: PersistOptions<TState>["partialize"];
  /** Migration function for version upgrades */
  migrate?: PersistOptions<TState>["migrate"];
  /** Custom storage (defaults to localStorage) */
  storage?: PersistOptions<TState>["storage"];
}): PersistOptions<TState> {
  return {
    name: makePersistKey(opts.name, opts.version),
    partialize: opts.partialize,
    migrate: opts.migrate,
    storage: opts.storage,
  };
}

/**
 * Common migration helper: merges old state with new defaults.
 * Use this when adding new fields to existing stores.
 */
export function createMergeStateMigration<TState extends PersistVersioned>(
  defaults: TState
): NonNullable<PersistOptions<TState>["migrate"]> {
  return (persistedState: unknown): TState => {
    if (typeof persistedState !== "object" || persistedState === null) {
      return defaults;
    }
    return { ...defaults, ...persistedState } as TState;
  };
}

/**
 * Clear persisted state for a given store.
 * Useful for logout or reset functionality.
 */
export function clearPersistedState(namespace: string, version: string): void {
  const key = makePersistKey(namespace, version);
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(key);
  }
}

/**
 * Get persisted state without hydrating store.
 * Useful for SSR or debugging.
 */
export function getPersistedState<TState>(namespace: string, version: string): TState | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  const key = makePersistKey(namespace, version);
  const item = window.localStorage.getItem(key);
  if (!item) return null;

  try {
    const parsed = JSON.parse(item) as StorageValue<TState>;
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

/**
 * SessionStorage adapter for temporary persistence.
 * Use for state that should reset on tab close.
 */
export function createSessionStorage<TState>(): PersistOptions<TState>["storage"] {
  if (typeof window === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return undefined as any;
  }

  return {
    getItem: (name: string) => {
      const item = window.sessionStorage.getItem(name);
      return item ? (JSON.parse(item) as { state: TState }) : null;
    },
    setItem: (name: string, value: { state: TState }) => {
      window.sessionStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: (name: string) => {
      window.sessionStorage.removeItem(name);
    },
  };
}
