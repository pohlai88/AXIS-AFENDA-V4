import type { StateCreator, StoreApi, UseBoundStore } from "zustand";

/**
 * Zustand Type Utilities
 * - Consistent type patterns for all stores
 * - Middleware-friendly creators
 * - Slice composition helpers
 */

export type AnyState = Record<string, unknown>;

export type BoundStore<TState extends AnyState> = UseBoundStore<StoreApi<TState>>;

/**
 * Set function type for actions
 */
export type SetState<TState extends AnyState> = StoreApi<TState>["setState"];

/**
 * Get function type for selectors
 */
export type GetState<TState extends AnyState> = StoreApi<TState>["getState"];

/**
 * Slice creator for composing large stores without type drift.
 * Use this pattern to split stores into focused slices.
 */
export type SliceCreator<TState extends AnyState, TSlice extends AnyState> = (
  set: SetState<TState>,
  get: GetState<TState>,
  api: StoreApi<TState>
) => TSlice;

/**
 * Middleware-friendly state creator.
 * Compatible with devtools, persist, subscribeWithSelector.
 */
export type Creator<TState extends AnyState> = StateCreator<TState, [], [], TState>;

/**
 * Store with typed actions.
 * Separates state from actions for clarity.
 */
export type StoreWithActions<TState extends AnyState, TActions extends AnyState> = TState & TActions;

/**
 * Selector function type.
 */
export type Selector<TState extends AnyState, TResult = unknown> = (state: TState) => TResult;

/**
 * Partial state update type.
 */
export type PartialState<TState extends AnyState> = Partial<TState> | ((state: TState) => Partial<TState>);

/**
 * Store subscription callback.
 */
export type StoreSubscriber<TState extends AnyState> = (state: TState, prevState: TState) => void;

/**
 * Store initialization options.
 */
export type StoreInitOptions<TState extends AnyState> = {
  /** Store name for devtools */
  name: string;
  /** Initial state */
  initial: TState;
  /** Enable devtools (defaults to NODE_ENV !== 'production') */
  enableDevtools?: boolean;
  /** Enable trace logs in devtools */
  enableTrace?: boolean;
};
