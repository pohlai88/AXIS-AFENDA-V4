import type { BaseColor, DesignSystemSettings } from "@/lib/contracts/tenant-design-system"

/**
 * Shared design-system palettes.
 *
 * IMPORTANT:
 * - Must be importable by both server and client (no `server-only`).
 * - Values are OKLCH strings compatible with the v4 shadcn tokens.
 */

export type ThemePalette = {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  border: string
  input: string
  ring: string
  sidebar: string
  sidebarForeground: string
  sidebarBorder: string
  sidebarRing: string
  sidebarAccent: string
  sidebarAccentForeground: string
}

export type BaseColorPalette = {
  light: ThemePalette
  dark: ThemePalette
}

// Base color palettes (OKLCH values for light/dark modes).
export const BASE_COLOR_PALETTES: Record<BaseColor, BaseColorPalette> = {
  stone: {
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.147 0.004 49.25)",
      muted: "oklch(0.97 0.001 106.424)",
      mutedForeground: "oklch(0.553 0.013 58.071)",
      border: "oklch(0.923 0.003 48.717)",
      input: "oklch(0.923 0.003 48.717)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.147 0.004 49.25)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.147 0.004 49.25)",
      accent: "oklch(0.97 0.001 106.424)",
      accentForeground: "oklch(0.216 0.006 56.043)",
      ring: "oklch(0.709 0.01 56.259)",
      sidebar: "oklch(0.985 0.001 106.423)",
      sidebarForeground: "oklch(0.147 0.004 49.25)",
      sidebarBorder: "oklch(0.923 0.003 48.717)",
      sidebarRing: "oklch(0.709 0.01 56.259)",
      sidebarAccent: "oklch(0.97 0.001 106.424)",
      sidebarAccentForeground: "oklch(0.216 0.006 56.043)",
    },
    dark: {
      background: "oklch(0.147 0.004 49.25)",
      foreground: "oklch(0.985 0.001 106.423)",
      muted: "oklch(0.268 0.007 34.298)",
      mutedForeground: "oklch(0.709 0.01 56.259)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      card: "oklch(0.216 0.006 56.043)",
      cardForeground: "oklch(0.985 0.001 106.423)",
      popover: "oklch(0.216 0.006 56.043)",
      popoverForeground: "oklch(0.985 0.001 106.423)",
      accent: "oklch(0.268 0.007 34.298)",
      accentForeground: "oklch(0.985 0.001 106.423)",
      ring: "oklch(0.553 0.013 58.071)",
      sidebar: "oklch(0.216 0.006 56.043)",
      sidebarForeground: "oklch(0.985 0.001 106.423)",
      sidebarBorder: "oklch(1 0 0 / 10%)",
      sidebarRing: "oklch(0.553 0.013 58.071)",
      sidebarAccent: "oklch(0.268 0.007 34.298)",
      sidebarAccentForeground: "oklch(0.985 0.001 106.423)",
    },
  },
  gray: {
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0.005 285.823)",
      muted: "oklch(0.967 0.001 286.375)",
      mutedForeground: "oklch(0.446 0.03 256.802)",
      border: "oklch(0.928 0.006 264.531)",
      input: "oklch(0.928 0.006 264.531)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.145 0.005 285.823)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.145 0.005 285.823)",
      accent: "oklch(0.967 0.001 286.375)",
      accentForeground: "oklch(0.21 0.006 285.885)",
      ring: "oklch(0.707 0.022 261.325)",
      sidebar: "oklch(0.985 0.002 247.839)",
      sidebarForeground: "oklch(0.145 0.005 285.823)",
      sidebarBorder: "oklch(0.928 0.006 264.531)",
      sidebarRing: "oklch(0.707 0.022 261.325)",
      sidebarAccent: "oklch(0.967 0.001 286.375)",
      sidebarAccentForeground: "oklch(0.21 0.006 285.885)",
    },
    dark: {
      background: "oklch(0.145 0.005 285.823)",
      foreground: "oklch(0.985 0 0)",
      muted: "oklch(0.274 0.006 286.033)",
      mutedForeground: "oklch(0.707 0.022 261.325)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      card: "oklch(0.21 0.006 285.885)",
      cardForeground: "oklch(0.985 0 0)",
      popover: "oklch(0.21 0.006 285.885)",
      popoverForeground: "oklch(0.985 0 0)",
      accent: "oklch(0.274 0.006 286.033)",
      accentForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.446 0.03 256.802)",
      sidebar: "oklch(0.21 0.006 285.885)",
      sidebarForeground: "oklch(0.985 0 0)",
      sidebarBorder: "oklch(1 0 0 / 10%)",
      sidebarRing: "oklch(0.446 0.03 256.802)",
      sidebarAccent: "oklch(0.274 0.006 286.033)",
      sidebarAccentForeground: "oklch(0.985 0 0)",
    },
  },
  zinc: {
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.141 0.005 285.823)",
      muted: "oklch(0.967 0.001 286.375)",
      mutedForeground: "oklch(0.552 0.016 285.938)",
      border: "oklch(0.92 0.004 286.32)",
      input: "oklch(0.92 0.004 286.32)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.141 0.005 285.823)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.141 0.005 285.823)",
      accent: "oklch(0.967 0.001 286.375)",
      accentForeground: "oklch(0.21 0.006 285.885)",
      ring: "oklch(0.705 0.015 286.067)",
      sidebar: "oklch(0.985 0.002 247.839)",
      sidebarForeground: "oklch(0.141 0.005 285.823)",
      sidebarBorder: "oklch(0.92 0.004 286.32)",
      sidebarRing: "oklch(0.705 0.015 286.067)",
      sidebarAccent: "oklch(0.967 0.001 286.375)",
      sidebarAccentForeground: "oklch(0.21 0.006 285.885)",
    },
    dark: {
      background: "oklch(0.141 0.005 285.823)",
      foreground: "oklch(0.985 0 0)",
      muted: "oklch(0.274 0.006 286.033)",
      mutedForeground: "oklch(0.705 0.015 286.067)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      card: "oklch(0.21 0.006 285.885)",
      cardForeground: "oklch(0.985 0 0)",
      popover: "oklch(0.21 0.006 285.885)",
      popoverForeground: "oklch(0.985 0 0)",
      accent: "oklch(0.274 0.006 286.033)",
      accentForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.552 0.016 285.938)",
      sidebar: "oklch(0.21 0.006 285.885)",
      sidebarForeground: "oklch(0.985 0 0)",
      sidebarBorder: "oklch(1 0 0 / 10%)",
      sidebarRing: "oklch(0.552 0.016 285.938)",
      sidebarAccent: "oklch(0.274 0.006 286.033)",
      sidebarAccentForeground: "oklch(0.985 0 0)",
    },
  },
  slate: {
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.129 0.042 264.695)",
      muted: "oklch(0.968 0.007 247.896)",
      mutedForeground: "oklch(0.554 0.046 257.417)",
      border: "oklch(0.929 0.013 255.508)",
      input: "oklch(0.929 0.013 255.508)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.129 0.042 264.695)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.129 0.042 264.695)",
      accent: "oklch(0.968 0.007 247.896)",
      accentForeground: "oklch(0.208 0.042 265.755)",
      ring: "oklch(0.704 0.04 256.788)",
      sidebar: "oklch(0.984 0.003 247.858)",
      sidebarForeground: "oklch(0.129 0.042 264.695)",
      sidebarBorder: "oklch(0.929 0.013 255.508)",
      sidebarRing: "oklch(0.704 0.04 256.788)",
      sidebarAccent: "oklch(0.968 0.007 247.896)",
      sidebarAccentForeground: "oklch(0.208 0.042 265.755)",
    },
    dark: {
      background: "oklch(0.129 0.042 264.695)",
      foreground: "oklch(0.984 0.003 247.858)",
      muted: "oklch(0.279 0.041 260.031)",
      mutedForeground: "oklch(0.704 0.04 256.788)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      card: "oklch(0.208 0.042 265.755)",
      cardForeground: "oklch(0.984 0.003 247.858)",
      popover: "oklch(0.208 0.042 265.755)",
      popoverForeground: "oklch(0.984 0.003 247.858)",
      accent: "oklch(0.279 0.041 260.031)",
      accentForeground: "oklch(0.984 0.003 247.858)",
      ring: "oklch(0.554 0.046 257.417)",
      sidebar: "oklch(0.208 0.042 265.755)",
      sidebarForeground: "oklch(0.984 0.003 247.858)",
      sidebarBorder: "oklch(1 0 0 / 10%)",
      sidebarRing: "oklch(0.554 0.046 257.417)",
      sidebarAccent: "oklch(0.279 0.041 260.031)",
      sidebarAccentForeground: "oklch(0.984 0.003 247.858)",
    },
  },
  neutral: {
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0 0)",
      muted: "oklch(0.97 0 0)",
      mutedForeground: "oklch(0.556 0 0)",
      border: "oklch(0.922 0 0)",
      input: "oklch(0.922 0 0)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.145 0 0)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.145 0 0)",
      accent: "oklch(0.97 0 0)",
      accentForeground: "oklch(0.205 0 0)",
      ring: "oklch(0.708 0 0)",
      sidebar: "oklch(0.985 0 0)",
      sidebarForeground: "oklch(0.145 0 0)",
      sidebarBorder: "oklch(0.922 0 0)",
      sidebarRing: "oklch(0.708 0 0)",
      sidebarAccent: "oklch(0.97 0 0)",
      sidebarAccentForeground: "oklch(0.205 0 0)",
    },
    dark: {
      background: "oklch(0.145 0 0)",
      foreground: "oklch(0.985 0 0)",
      muted: "oklch(0.269 0 0)",
      mutedForeground: "oklch(0.708 0 0)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      card: "oklch(0.205 0 0)",
      cardForeground: "oklch(0.985 0 0)",
      popover: "oklch(0.205 0 0)",
      popoverForeground: "oklch(0.985 0 0)",
      accent: "oklch(0.269 0 0)",
      accentForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.556 0 0)",
      sidebar: "oklch(0.205 0 0)",
      sidebarForeground: "oklch(0.985 0 0)",
      sidebarBorder: "oklch(1 0 0 / 10%)",
      sidebarRing: "oklch(0.556 0 0)",
      sidebarAccent: "oklch(0.269 0 0)",
      sidebarAccentForeground: "oklch(0.985 0 0)",
    },
  },
}

type BrandKey = NonNullable<DesignSystemSettings["brandColor"]>

export type BrandPalette = {
  light: {
    primary: string
    primaryForeground: string
    chart: [string, string, string, string, string]
    sidebarPrimary?: string
    sidebarPrimaryForeground?: string
  }
  dark: {
    primary: string
    primaryForeground: string
    chart: [string, string, string, string, string]
    sidebarPrimary?: string
    sidebarPrimaryForeground?: string
  }
}

/**
 * Brand palettes map to the "primary" (and charts/sidebar primary).
 * Defaults align with your current `app/globals.css`.
 */
export const BRAND_PALETTES: Record<BrandKey, BrandPalette> = {
  emerald: {
    light: {
      primary: "oklch(0.60 0.13 163)",
      primaryForeground: "oklch(0.98 0.02 166)",
      chart: [
        "oklch(0.85 0.13 165)",
        "oklch(0.77 0.15 163)",
        "oklch(0.70 0.15 162)",
        "oklch(0.60 0.13 163)",
        "oklch(0.51 0.10 166)",
      ],
      sidebarPrimary: "oklch(0.60 0.13 163)",
      sidebarPrimaryForeground: "oklch(0.98 0.02 166)",
    },
    dark: {
      primary: "oklch(0.70 0.15 162)",
      primaryForeground: "oklch(0.26 0.05 173)",
      chart: [
        "oklch(0.85 0.13 165)",
        "oklch(0.77 0.15 163)",
        "oklch(0.70 0.15 162)",
        "oklch(0.60 0.13 163)",
        "oklch(0.51 0.10 166)",
      ],
      sidebarPrimary: "oklch(0.77 0.15 163)",
      sidebarPrimaryForeground: "oklch(0.26 0.05 173)",
    },
  },
  blue: {
    light: {
      primary: "oklch(0.62 0.17 254)",
      primaryForeground: "oklch(0.98 0.02 255)",
      chart: [
        "oklch(0.86 0.12 252)",
        "oklch(0.78 0.14 253)",
        "oklch(0.70 0.16 254)",
        "oklch(0.62 0.17 254)",
        "oklch(0.54 0.14 255)",
      ],
    },
    dark: {
      primary: "oklch(0.72 0.16 252)",
      primaryForeground: "oklch(0.26 0.05 255)",
      chart: [
        "oklch(0.86 0.12 252)",
        "oklch(0.78 0.14 253)",
        "oklch(0.70 0.16 254)",
        "oklch(0.62 0.17 254)",
        "oklch(0.54 0.14 255)",
      ],
    },
  },
  violet: {
    light: {
      primary: "oklch(0.60 0.20 294)",
      primaryForeground: "oklch(0.98 0.02 295)",
      chart: [
        "oklch(0.86 0.12 295)",
        "oklch(0.78 0.16 293)",
        "oklch(0.70 0.19 294)",
        "oklch(0.60 0.20 294)",
        "oklch(0.54 0.16 295)",
      ],
    },
    dark: {
      primary: "oklch(0.70 0.19 294)",
      primaryForeground: "oklch(0.26 0.05 295)",
      chart: [
        "oklch(0.86 0.12 295)",
        "oklch(0.78 0.16 293)",
        "oklch(0.70 0.19 294)",
        "oklch(0.60 0.20 294)",
        "oklch(0.54 0.16 295)",
      ],
    },
  },
  rose: {
    light: {
      primary: "oklch(0.62 0.24 12)",
      primaryForeground: "oklch(0.98 0.02 12)",
      chart: [
        "oklch(0.86 0.12 12)",
        "oklch(0.78 0.16 12)",
        "oklch(0.70 0.20 12)",
        "oklch(0.62 0.24 12)",
        "oklch(0.54 0.20 12)",
      ],
    },
    dark: {
      primary: "oklch(0.72 0.22 12)",
      primaryForeground: "oklch(0.26 0.05 12)",
      chart: [
        "oklch(0.86 0.12 12)",
        "oklch(0.78 0.16 12)",
        "oklch(0.70 0.20 12)",
        "oklch(0.62 0.24 12)",
        "oklch(0.54 0.20 12)",
      ],
    },
  },
  orange: {
    light: {
      primary: "oklch(0.72 0.18 55)",
      primaryForeground: "oklch(0.22 0.03 55)",
      chart: [
        "oklch(0.88 0.10 55)",
        "oklch(0.82 0.14 55)",
        "oklch(0.78 0.16 55)",
        "oklch(0.72 0.18 55)",
        "oklch(0.62 0.16 55)",
      ],
    },
    dark: {
      primary: "oklch(0.78 0.18 55)",
      primaryForeground: "oklch(0.22 0.03 55)",
      chart: [
        "oklch(0.88 0.10 55)",
        "oklch(0.82 0.14 55)",
        "oklch(0.78 0.16 55)",
        "oklch(0.72 0.18 55)",
        "oklch(0.62 0.16 55)",
      ],
    },
  },
}

