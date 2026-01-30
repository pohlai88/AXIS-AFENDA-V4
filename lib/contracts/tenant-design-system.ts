import { z } from "zod"

/**
 * Tenant Design System Contracts
 *
 * Defines the schema for tenant-scoped theme customization settings.
 * Based on shadcn/ui's create implementation (MIT licensed).
 */

// ============ Available Options ============
export const BaseColors = z.enum(["stone", "gray", "zinc", "slate", "neutral"])
export type BaseColor = z.infer<typeof BaseColors>

export const ThemeModes = z.enum(["light", "dark", "system"])
export type ThemeMode = z.infer<typeof ThemeModes>

export const Fonts = z.enum(["figtree", "inter", "system"])
export type Font = z.infer<typeof Fonts>

export const BrandColors = z.enum(["emerald", "blue", "violet", "rose", "orange"])
export type BrandColor = z.infer<typeof BrandColors>

// ============ Design System Settings ============
export const designSystemSettingsSchema = z.object({
  style: z.string().optional().describe("shadcn style variant (e.g., 'new-york')"),
  baseColor: BaseColors.optional().describe("Base neutral color palette"),
  brandColor: BrandColors.optional().describe("Brand (primary) color palette"),
  theme: ThemeModes.optional().describe("Theme mode preference"),
  // Back-compat (applies to both modes)
  menuColor: z.string().optional().describe("Custom menu background color (OKLCH)"),
  menuAccent: z.string().optional().describe("Custom menu accent color (OKLCH)"),
  // Per-mode overrides (take precedence over menuColor/menuAccent)
  menuColorLight: z.string().optional().describe("Light mode menu background color (OKLCH)"),
  menuColorDark: z.string().optional().describe("Dark mode menu background color (OKLCH)"),
  menuAccentLight: z.string().optional().describe("Light mode menu accent color (OKLCH)"),
  menuAccentDark: z.string().optional().describe("Dark mode menu accent color (OKLCH)"),
  font: Fonts.optional().describe("Primary font family"),
  radius: z.number().min(0).max(1.5).optional().describe("Border radius scale (rem)"),
})

export type DesignSystemSettings = z.infer<typeof designSystemSettingsSchema>

// ============ Request/Response Schemas ============
export const updateDesignSystemRequestSchema = designSystemSettingsSchema

export type UpdateDesignSystemRequest = z.infer<typeof updateDesignSystemRequestSchema>

export const designSystemResponseSchema = z.object({
  tenantId: z.string(),
  settings: designSystemSettingsSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type DesignSystemResponse = z.infer<typeof designSystemResponseSchema>

// ============ Defaults ============
export const DEFAULT_DESIGN_SYSTEM: DesignSystemSettings = {
  style: "new-york",
  baseColor: "stone",
  brandColor: "emerald",
  theme: "system",
  font: "figtree",
  radius: 0.625,
}
