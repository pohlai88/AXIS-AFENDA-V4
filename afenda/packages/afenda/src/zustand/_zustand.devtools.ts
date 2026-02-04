import type { DevtoolsOptions } from "zustand/middleware";

/**
 * Devtools utilities for debugging Zustand stores.
 */

/**
 * Create devtools options with consistent defaults.
 */
export function makeDevtoolsOptions(opts: {
  name: string;
  enabled?: boolean;
  trace?: boolean;
  anonymousActionType?: string;
}): DevtoolsOptions {
  return {
    name: opts.name,
    enabled: opts.enabled ?? process.env.NODE_ENV !== "production",
    trace: opts.trace ?? false,
    anonymousActionType: opts.anonymousActionType ?? "action",
  };
}

/**
 * Check if devtools are enabled.
 */
export function isDevtoolsEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Get devtools instance (if available).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDevtools(): any {
  if (typeof window === "undefined") return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).__REDUX_DEVTOOLS_EXTENSION__;
}

/**
 * Devtools action types for consistent naming.
 */
export const DEVTOOLS_ACTIONS = {
  SET: "setState",
  RESET: "reset",
  REPLACE: "replace",
  UPDATE: "update",
  TOGGLE: "toggle",
  ADD: "add",
  REMOVE: "remove",
  CLEAR: "clear",
} as const;

export type DevtoolsAction = (typeof DEVTOOLS_ACTIONS)[keyof typeof DEVTOOLS_ACTIONS];
