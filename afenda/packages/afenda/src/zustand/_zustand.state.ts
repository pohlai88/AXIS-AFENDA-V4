"use client";

import type { AnyState, SetState } from "./_zustand.types";

/**
 * State helpers shared across stores/slices.
 * Keeps mutation patterns consistent and fully typed.
 */

export type PartialUpdate<TState extends AnyState> =
  | Partial<TState>
  | undefined
  | void
  | ((state: TState) => Partial<TState> | undefined | void);

/**
 * Patch the current state with a partial object.
 * Accepts either a plain partial or a callback that returns one.
 */
export function patchState<TState extends AnyState>(
  set: SetState<TState>,
  update: PartialUpdate<TState>,
  actionName?: string
): void {
  set(
    (state) => {
      const patch = typeof update === "function" ? update(state) : update;
      if (!patch) return state;
      return { ...state, ...patch };
    },
    false,
    actionName
  );
}

/**
 * Replace the entire state (used for hard resets/migrations).
 */
export function replaceState<TState extends AnyState>(
  set: SetState<TState>,
  next: TState,
  actionName?: string
): void {
  set(() => next, true, actionName);
}
