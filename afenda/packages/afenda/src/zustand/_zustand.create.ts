"use client";

import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import type { PersistOptions } from "zustand/middleware";
import type { StoreApi, StateCreator } from "zustand";
import type { BoundStore, AnyState, SetState, GetState } from "./_zustand.types";

/**
 * Canonical store factory with best practices:
 * - subscribeWithSelector for efficient subscriptions
 * - devtools enabled in non-production
 * - optional persist middleware
 * - type-safe builder pattern
 *
 * NOTE: This file is client-only by design.
 */

export type CreateStoreOptions<TState extends AnyState> = {
  /** Store name (used in devtools) */
  name: string;
  /** Initial state */
  initial: TState;
  /** State builder function */
  build: (set: SetState<TState>, get: GetState<TState>, api: StoreApi<TState>) => TState;
  /** Optional persist configuration */
  persistOptions?: PersistOptions<TState>;
  /** Enable devtools (defaults to NODE_ENV !== 'production') */
  enableDevtools?: boolean;
  /** Enable trace in devtools (defaults to false) */
  enableTrace?: boolean;
};

export function createStore<TState extends AnyState>(
  opts: CreateStoreOptions<TState>
): BoundStore<TState> {
  const enableDevtools = opts.enableDevtools ?? process.env.NODE_ENV !== "production";

  const creator = (set: SetState<TState>, get: GetState<TState>, api: StoreApi<TState>) => ({
    ...opts.initial,
    ...opts.build(set, get, api),
  });

  const withPersist = opts.persistOptions
    ? (persist(creator, opts.persistOptions) as StateCreator<TState>)
    : (creator as StateCreator<TState>);

  const withDevtools = devtools(withPersist, {
    name: opts.name,
    enabled: enableDevtools,
    trace: opts.enableTrace ?? false,
  });

  return create<TState>()(subscribeWithSelector(withDevtools));
}

/**
 * Create a store without persistence.
 * Useful for ephemeral UI state (modals, selections, filters).
 */
export function createEphemeralStore<TState extends AnyState>(
  opts: Omit<CreateStoreOptions<TState>, "persistOptions">
): BoundStore<TState> {
  return createStore(opts);
}

/**
 * Create a store with automatic persistence.
 * Useful for user preferences (theme, layout, view settings).
 */
export function createPersistedStore<TState extends AnyState>(
  opts: CreateStoreOptions<TState> & { persistOptions: PersistOptions<TState> }
): BoundStore<TState> {
  return createStore(opts);
}
