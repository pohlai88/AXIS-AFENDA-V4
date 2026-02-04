/**
 * Action utilities for consistent state mutations.
 * Keep mutations explicit, pure, and testable.
 */

/**
 * Toggle a boolean value.
 */
export function toggle(current: boolean): boolean {
  return !current;
}

/**
 * Get unique strings from an array.
 * Filters out empty/falsy values.
 */
export function uniqueStrings(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

/**
 * Remove a specific string from an array.
 */
export function removeString(items: string[], value: string): string[] {
  return items.filter((x) => x !== value);
}

/**
 * Add a string to an array if not already present.
 */
export function addString(items: string[], value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return items;
  if (items.includes(trimmed)) return items;
  return [...items, trimmed];
}

/**
 * Toggle a string in an array (add if missing, remove if present).
 */
export function toggleString(items: string[], value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return items;
  return items.includes(trimmed) ? removeString(items, trimmed) : addString(items, trimmed);
}

/**
 * Remove an item by ID from an array of objects.
 */
export function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((item) => item.id !== id);
}

/**
 * Update an item by ID in an array of objects.
 */
export function updateById<T extends { id: string }>(
  items: T[],
  id: string,
  update: Partial<T> | ((item: T) => Partial<T>)
): T[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    const changes = typeof update === "function" ? update(item) : update;
    return { ...item, ...changes };
  });
}

/**
 * Upsert an item (update if exists, insert if new).
 */
export function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const exists = items.some((x) => x.id === item.id);
  return exists ? updateById(items, item.id, item) : [...items, item];
}

/**
 * Sort array by a key.
 */
export function sortBy<T>(items: T[], key: keyof T, direction: "asc" | "desc" = "asc"): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal === bVal) return 0;
    const comparison = aVal < bVal ? -1 : 1;
    return direction === "asc" ? comparison : -comparison;
  });
}

/**
 * Move an item in array by index.
 */
export function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return items;
  if (fromIndex < 0 || fromIndex >= items.length) return items;
  if (toIndex < 0 || toIndex >= items.length) return items;

  const result = [...items];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Increment a number safely.
 */
export function increment(current: number, by: number = 1): number {
  return current + by;
}

/**
 * Decrement a number safely.
 */
export function decrement(current: number, by: number = 1): number {
  return current - by;
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
