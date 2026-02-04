import type { StoreApi, UseBoundStore } from "zustand";
import type { AnyState } from "./_zustand.types";

/**
 * Testing utilities for Zustand stores.
 * Helpers for mocking, resetting, and inspecting stores in tests.
 */

/**
 * Get the current state of a store (for testing).
 */
export function getStoreState<TState extends AnyState>(
  store: UseBoundStore<StoreApi<TState>>
): TState {
  return store.getState();
}

/**
 * Set the state of a store directly (for testing setup).
 */
export function setStoreState<TState extends AnyState>(
  store: UseBoundStore<StoreApi<TState>>,
  state: Partial<TState>
): void {
  store.setState(state);
}

/**
 * Reset a store to initial state (if it has a reset action).
 */
export function resetStore<TState extends AnyState & { reset?: () => void }>(
  store: UseBoundStore<StoreApi<TState>>
): void {
  const state = store.getState();
  if (typeof state.reset === "function") {
    state.reset();
  }
}

/**
 * Subscribe to store changes (for testing side effects).
 */
export function subscribeToStore<TState extends AnyState>(
  store: UseBoundStore<StoreApi<TState>>,
  callback: (state: TState, prevState: TState) => void
): () => void {
  return store.subscribe(callback);
}

/**
 * Wait for a condition to be true in the store.
 * Useful for async testing.
 */
export function waitForStoreCondition<TState extends AnyState>(
  store: UseBoundStore<StoreApi<TState>>,
  predicate: (state: TState) => boolean,
  timeout = 5000
): Promise<TState> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error(`Store condition timeout after ${timeout}ms`));
    }, timeout);

    // Check immediately
    const currentState = store.getState();
    if (predicate(currentState)) {
      clearTimeout(timer);
      resolve(currentState);
      return;
    }

    // Subscribe to changes
    const unsubscribe = store.subscribe((state: TState) => {
      if (predicate(state)) {
        clearTimeout(timer);
        unsubscribe();
        resolve(state);
      }
    });
  });
}

/**
 * Create a mock store for testing.
 */
export function createMockStore<TState extends AnyState>(
  initialState: TState
): UseBoundStore<StoreApi<TState>> {
  const listeners = new Set<(state: TState, prevState: TState) => void>();
  let state = initialState;

  const getState = (): TState => state;

  const setState = (partial: Partial<TState> | ((state: TState) => Partial<TState>)): void => {
    const prevState = state;
    const updates = typeof partial === "function" ? partial(state) : partial;
    state = { ...state, ...updates };
    listeners.forEach((listener) => listener(state, prevState));
  };

  const subscribe = (listener: (state: TState, prevState: TState) => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    getState,
    setState,
    subscribe,
    destroy: () => listeners.clear(),
  } as UseBoundStore<StoreApi<TState>>;
}

/**
 * Spy on store actions (for testing).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function spyOnStoreAction<TState extends AnyState, TArgs extends readonly any[], TReturn = unknown>(
  store: UseBoundStore<StoreApi<TState>>,
  actionName: keyof TState,
  mock?: (...args: TArgs) => TReturn
): { restore: () => void; calls: TArgs[] } {
  const state = store.getState();
  const original = state[actionName];

  if (typeof original !== "function") {
    throw new Error(`${String(actionName)} is not a function`);
  }

  const calls: TArgs[] = [];

  const spy = (...args: TArgs): TReturn => {
    calls.push(args);
    if (mock) {
      return mock(...args);
    }
    return (original as (..._args: TArgs) => TReturn)(...args);
  };

  store.setState({ [actionName]: spy } as Partial<TState>);

  return {
    calls,
    restore: () => {
      store.setState({ [actionName]: original } as Partial<TState>);
    },
  };
}
