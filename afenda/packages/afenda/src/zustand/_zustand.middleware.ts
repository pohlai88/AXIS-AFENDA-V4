import type { StateCreator } from "zustand";
import type { AnyState } from "./_zustand.types";

type SetState<T> = Parameters<StateCreator<T>>[0];

/**
 * Custom middleware utilities for Zustand.
 * Extend with your own middleware for logging, analytics, etc.
 */

/**
 * Logger middleware for development.
 * Logs all state changes to console.
 */
export const logger =
  <T extends AnyState>(config: StateCreator<T>): StateCreator<T> =>
  (set, get, api) => {
    const loggedSet = ((partial: unknown, replace?: boolean) => {
      const applySet = () => {
        if (replace) {
          set(partial as T, true);
          return;
        }

        set(
          partial as T | Partial<T> | ((state: T) => T | Partial<T>),
          false
        );
      };

      if (process.env.NODE_ENV !== "production") {
        const prevState = get();
        applySet();
        const nextState = get();
        console.log("[Zustand]", { prevState, nextState });
      } else {
        applySet();
      }
    }) as SetState<T>;

    return config(loggedSet, get, api);
  };

/**
 * Immer middleware helper type.
 * Use with immer for immutable updates.
 */
export type ImmerSetState<T> = (fn: (draft: T) => void) => void;

/**
 * Reset middleware.
 * Adds a reset function to any store.
 */
export const resetable =
  <T extends AnyState>(
    config: StateCreator<T>
  ): StateCreator<T & { reset: () => void }> =>
  (set, get, api) => {
    const initialState = config(set, get, api);
    const reset = () => set(() => ({ ...initialState, reset }), true);
    return {
      ...initialState,
      reset,
    };
  };

/**
 * Computed middleware.
 * Automatically derives values when dependencies change.
 */
export function createComputed<TState extends AnyState, TComputed extends AnyState>(
  computer: (state: TState) => TComputed
) {
  return (config: StateCreator<TState>): StateCreator<TState & TComputed> =>
    (set, get, api) => {
      const state = config(set, get, api);
      const computed = computer(state);
      return { ...state, ...computed };
    };
}

/**
 * Temporal middleware for undo/redo functionality.
 * Tracks state history with configurable limits.
 */
export type TemporalState<T> = {
  past: T[];
  present: T;
  future: T[];
};

export type TemporalActions = {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
};

export function temporal<T extends AnyState>(
  config: StateCreator<T>,
  options: { limit?: number } = {}
): StateCreator<T & TemporalState<T> & TemporalActions> {
  const limit = options.limit ?? 100;

  type TemporalStore = T & TemporalState<T> & TemporalActions;

  return (set, get, api) => {
    const state = config(set, get, api);
    const temporal: TemporalState<T> = {
      past: [],
      present: state,
      future: [],
    };

    const actions: TemporalActions = {
      undo: () => {
        set((s: TemporalStore) => {
          const { past, present, future } = s;
          if (past.length === 0) return s;

          const previous = past[past.length - 1];
          const newPast = past.slice(0, -1);

          return {
            ...s,
            ...previous,
            past: newPast,
            present: previous,
            future: [present, ...future],
          };
        });
      },

      redo: () => {
        set((s: TemporalStore) => {
          const { past, present, future } = s;
          if (future.length === 0) return s;

          const next = future[0];
          const newFuture = future.slice(1);

          return {
            ...s,
            ...next,
            past: [...past, present].slice(-limit),
            present: next,
            future: newFuture,
          };
        });
      },

      canUndo: () => {
        const s = get() as unknown as T & TemporalState<T>;
        return s.past?.length > 0;
      },

      canRedo: () => {
        const s = get() as unknown as T & TemporalState<T>;
        return s.future?.length > 0;
      },

      clearHistory: () => {
        set((s: TemporalStore) => ({
          ...s,
          past: [],
          future: [],
        }));
      },
    };

    return { ...state, ...actions, ...temporal } as T & TemporalState<T> & TemporalActions;
  };
}
