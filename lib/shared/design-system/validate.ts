import type { DesignSystemSettings } from "@/lib/contracts/tenant-design-system"

export type DesignSystemValidationErrors = Partial<
  Record<
    | "menuColor"
    | "menuAccent"
    | "menuColorLight"
    | "menuAccentLight"
    | "menuColorDark"
    | "menuAccentDark",
    string
  >
>

// Accepts: oklch(L C H) or oklch(L C H / A)
// - L, C, H: numbers (we keep validation intentionally permissive)
// - A: number or percent
const OKLCH_RE =
  /^oklch\(\s*([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)(?:\s*\/\s*([0-9]*\.?[0-9]+%?))?\s*\)$/i

function isCssVar(value: string) {
  return /^var\(\s*--[a-z0-9-_]+\s*\)$/i.test(value.trim())
}

export function isValidOklchOrVar(value: string): boolean {
  const v = value.trim()
  if (!v) return true
  if (isCssVar(v)) return true
  return OKLCH_RE.test(v)
}

export function getDesignSystemValidationErrors(
  settings: DesignSystemSettings
): DesignSystemValidationErrors {
  const errors: DesignSystemValidationErrors = {}

  const fields: Array<keyof DesignSystemValidationErrors> = [
    "menuColor",
    "menuAccent",
    "menuColorLight",
    "menuAccentLight",
    "menuColorDark",
    "menuAccentDark",
  ]

  for (const key of fields) {
    const value = settings[key]
    if (!value) continue
    if (!isValidOklchOrVar(value)) {
      errors[key] = "Use an OKLCH value like oklch(0.985 0.001 106.423) (optional / alpha), or var(--token)."
    }
  }

  return errors
}

export function hasDesignSystemValidationErrors(
  errors: DesignSystemValidationErrors
): boolean {
  return Object.keys(errors).length > 0
}

