import type { DesignSystemSettings } from "@/lib/contracts/tenant-design-system"
import { DEFAULT_DESIGN_SYSTEM } from "@/lib/contracts/tenant-design-system"
import { BASE_COLOR_PALETTES, BRAND_PALETTES } from "./palettes"

const FONT_FAMILIES = {
  figtree: "var(--font-figtree), system-ui, sans-serif",
  inter: "var(--font-inter), system-ui, sans-serif",
  system:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
} as const

const DESTRUCTIVE = {
  light: "oklch(0.577 0.245 27.325)",
  dark: "oklch(0.704 0.191 22.216)",
} as const

export function generateTenantCss(settings: DesignSystemSettings): string {
  const merged = { ...DEFAULT_DESIGN_SYSTEM, ...settings }

  const baseColor = merged.baseColor ?? "stone"
  const palette = BASE_COLOR_PALETTES[baseColor] ?? BASE_COLOR_PALETTES.stone

  const brandKey = merged.brandColor ?? "emerald"
  const brand = BRAND_PALETTES[brandKey] ?? BRAND_PALETTES.emerald

  const radius = merged.radius ?? 0.625
  const font = merged.font ?? "figtree"

  const light = palette.light
  const dark = palette.dark

  const sidebarLight = {
    sidebar:
      settings.menuColorLight ??
      settings.menuColor ??
      light.sidebar,
    sidebarAccent:
      settings.menuAccentLight ??
      settings.menuAccent ??
      light.sidebarAccent,
  }

  const sidebarDark = {
    sidebar:
      settings.menuColorDark ??
      settings.menuColor ??
      dark.sidebar,
    sidebarAccent:
      settings.menuAccentDark ??
      settings.menuAccent ??
      dark.sidebarAccent,
  }

  // Secondary tokens are derived from the neutral palette (common pattern).
  const lightSecondary = light.muted
  const lightSecondaryForeground = light.accentForeground
  const darkSecondary = dark.muted
  const darkSecondaryForeground = dark.accentForeground

  const [chart1, chart2, chart3, chart4, chart5] = brand.light.chart
  const [dChart1, dChart2, dChart3, dChart4, dChart5] = brand.dark.chart

  return `:root {
  --font-sans: ${FONT_FAMILIES[font as keyof typeof FONT_FAMILIES] ?? FONT_FAMILIES.figtree};
  --background: ${light.background};
  --foreground: ${light.foreground};
  --card: ${light.card};
  --card-foreground: ${light.cardForeground};
  --popover: ${light.popover};
  --popover-foreground: ${light.popoverForeground};
  --primary: ${brand.light.primary};
  --primary-foreground: ${brand.light.primaryForeground};
  --secondary: ${lightSecondary};
  --secondary-foreground: ${lightSecondaryForeground};
  --muted: ${light.muted};
  --muted-foreground: ${light.mutedForeground};
  --accent: ${light.accent};
  --accent-foreground: ${light.accentForeground};
  --destructive: ${DESTRUCTIVE.light};
  --border: ${light.border};
  --input: ${light.input};
  --ring: ${light.ring};
  --chart-1: ${chart1};
  --chart-2: ${chart2};
  --chart-3: ${chart3};
  --chart-4: ${chart4};
  --chart-5: ${chart5};
  --radius: ${radius}rem;
  --sidebar: ${sidebarLight.sidebar};
  --sidebar-foreground: ${light.sidebarForeground};
  --sidebar-primary: ${brand.light.sidebarPrimary ?? brand.light.primary};
  --sidebar-primary-foreground: ${brand.light.sidebarPrimaryForeground ?? brand.light.primaryForeground};
  --sidebar-accent: ${sidebarLight.sidebarAccent};
  --sidebar-accent-foreground: ${light.sidebarAccentForeground};
  --sidebar-border: ${light.sidebarBorder};
  --sidebar-ring: ${light.sidebarRing};
}

.dark {
  --background: ${dark.background};
  --foreground: ${dark.foreground};
  --card: ${dark.card};
  --card-foreground: ${dark.cardForeground};
  --popover: ${dark.popover};
  --popover-foreground: ${dark.popoverForeground};
  --primary: ${brand.dark.primary};
  --primary-foreground: ${brand.dark.primaryForeground};
  --secondary: ${darkSecondary};
  --secondary-foreground: ${darkSecondaryForeground};
  --muted: ${dark.muted};
  --muted-foreground: ${dark.mutedForeground};
  --accent: ${dark.accent};
  --accent-foreground: ${dark.accentForeground};
  --destructive: ${DESTRUCTIVE.dark};
  --border: ${dark.border};
  --input: ${dark.input};
  --ring: ${dark.ring};
  --chart-1: ${dChart1};
  --chart-2: ${dChart2};
  --chart-3: ${dChart3};
  --chart-4: ${dChart4};
  --chart-5: ${dChart5};
  --sidebar: ${sidebarDark.sidebar};
  --sidebar-foreground: ${dark.sidebarForeground};
  --sidebar-primary: ${brand.dark.sidebarPrimary ?? brand.dark.primary};
  --sidebar-primary-foreground: ${brand.dark.sidebarPrimaryForeground ?? brand.dark.primaryForeground};
  --sidebar-accent: ${sidebarDark.sidebarAccent};
  --sidebar-accent-foreground: ${dark.sidebarAccentForeground};
  --sidebar-border: ${dark.sidebarBorder};
  --sidebar-ring: ${dark.sidebarRing};
}`
}

