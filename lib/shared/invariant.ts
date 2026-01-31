/**
 * Custom error for invariant violations.
 */
export class InvariantError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvariantError"
  }
}

/**
 * Asserts that a condition is true, throws an InvariantError if not.
 * 
 * Invariants are conditions that should never be violated during normal execution.
 * Use this for runtime checks that should fail fast if something unexpected occurs.
 * 
 * @param condition - The condition to check
 * @param message - Optional error message
 * @throws InvariantError if condition is false
 * 
 * @example
 * ```typescript
 * function divide(a: number, b: number): number {
 *   validateInvariant(b !== 0, "Division by zero")
 *   return a / b
 * }
 * ```
 */
export function validateInvariant(
  condition: unknown,
  message = "Invariant failed"
): asserts condition {
  if (!condition) {
    throw new InvariantError(message)
  }
}

// Legacy export for backward compatibility
/** @deprecated Use validateInvariant() instead */
export const invariant = validateInvariant
