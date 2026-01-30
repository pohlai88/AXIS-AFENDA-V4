/**
 * Shared color constants for UI components.
 * Uses Tailwind v4 semantic colors when possible.
 */

export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-secondary text-secondary-foreground",
  high: "bg-primary/10 text-primary",
  urgent: "bg-destructive/10 text-destructive",
}

// Semantic color utilities for common states
export const STATUS_COLORS: Record<string, string> = {
  todo: "text-muted-foreground",
  in_progress: "text-primary",
  done: "text-primary",
  cancelled: "text-muted-foreground",
}

// Error/alert color classes
export const ERROR_BG = "bg-destructive/10"
export const ERROR_TEXT = "text-destructive"
export const WARNING_BG = "bg-secondary"
export const WARNING_TEXT = "text-secondary-foreground"
export const SUCCESS_BG = "bg-primary/10"
export const SUCCESS_TEXT = "text-primary"
