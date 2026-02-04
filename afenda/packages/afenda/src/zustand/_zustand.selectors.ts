import { shallow } from "zustand/shallow";
import type { AnyState, Selector } from "./_zustand.types";

/**
 * Selector utilities for performance optimization.
 * Keep selectors in this layer so UI components stay clean.
 */

/**
 * Identity selector (returns entire state).
 */
export const identity = <T>(v: T): T => v;

/**
 * Shallow equality comparison.
 * Re-exported from zustand for convenience.
 */
export { shallow };

/**
 * Create a memoized selector factory.
 */
export function createSelector<TState extends AnyState, TResult>(
  selector: Selector<TState, TResult>
): Selector<TState, TResult> {
  return selector;
}

/**
 * Combine multiple selectors into one.
 */
export function combineSelectors<TState extends AnyState, TResult extends AnyState>(
  selectors: { [K in keyof TResult]: Selector<TState, TResult[K]> }
): Selector<TState, TResult> {
  return (state: TState) => {
    const result = {} as TResult;
    for (const key in selectors) {
      result[key] = selectors[key](state);
    }
    return result;
  };
}

/**
 * Check if a value is a non-empty string.
 */
export function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Check if an array has items.
 */
export function hasItems<T>(value: T[] | undefined | null): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Check if object has a property.
 */
export function hasProperty<T extends AnyState, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

/**
 * Safe array access selector.
 */
export function selectById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

/**
 * Filter items by predicate.
 */
export function selectWhere<T>(items: T[], predicate: (item: T) => boolean): T[] {
  return items.filter(predicate);
}

/**
 * Count items matching predicate.
 */
export function countWhere<T>(items: T[], predicate: (item: T) => boolean): number {
  return items.filter(predicate).length;
}

/**
 * Check if any item matches predicate.
 */
export function someWhere<T>(items: T[], predicate: (item: T) => boolean): boolean {
  return items.some(predicate);
}

/**
 * Check if all items match predicate.
 */
export function everyWhere<T>(items: T[], predicate: (item: T) => boolean): boolean {
  return items.every(predicate);
}
