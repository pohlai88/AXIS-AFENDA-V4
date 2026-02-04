/**
 * @domain shared
 * @layer ui
 * @responsibility Central export point for all shadcn/ui components and custom extensions
 * @owner afenda/shadcn
 * @dependencies
 * - radix-ui (external)
 * - @/lib/utils
 * @exports
 * - All shadcn/ui components
 * - Custom component extensions
 */

// ============================================================================
// OFFICIAL SHADCN/UI COMPONENTS
// ============================================================================

export * from "./accordion"
export * from "./alert"
export * from "./alert-dialog"
export * from "./aspect-ratio"
export * from "./avatar"
export * from "./badge"
export * from "./breadcrumb"
export * from "./button"
export * from "./button-group"
export * from "./calendar"
export * from "./card"
export * from "./carousel"
export * from "./chart"
export * from "./checkbox"
export * from "./collapsible"
export * from "./combobox"
export * from "./command"
export * from "./context-menu"
export * from "./dialog"
export * from "./drawer"
export * from "./dropdown-menu"
export * from "./empty"
export * from "./field"
export * from "./form"
export * from "./hover-card"
export * from "./input"
export * from "./input-group"
export * from "./input-otp"
export * from "./item"
export * from "./kbd"
export * from "./label"
export * from "./menubar"
export * from "./native-select"
export * from "./navigation-menu"
export * from "./pagination"
export * from "./popover"
export * from "./progress"
export * from "./radio-group"
// export * from "./resizable" // Removed - use bento-grid for layout instead
export * from "./scroll-area"
export * from "./select"
export * from "./separator"
export * from "./sheet"
export * from "./sidebar"
export * from "./skeleton"
export * from "./slider"
export * from "./sonner"
export * from "./spinner"
export * from "./switch"
export * from "./table"
export * from "./tabs"
export * from "./textarea"
export * from "./toggle"
export * from "./toggle-group"
export * from "./tooltip"

// ============================================================================
// HOOKS & UTILITIES
// ============================================================================

export * from "./use-mobile"

// ============================================================================
// CUSTOM COMPONENTS (Extended/Composed)
// ============================================================================

export * from "./custom/animated-theme-toggler"
export * from "./custom/bento-grid"
export * from "./custom/border-beam"
export * from "./custom/date-picker"
export * from "./custom/dot-pattern"
export * from "./custom/kanban"
export * from "./custom/number-ticker"
export * from "./custom/password-input"
export * from "./custom/retro-grid"
export * from "./custom/shimmer-button"

// ============================================================================
// SHADCN BLOCKS (ERP-READY TEMPLATES)
// ============================================================================

export * from "./blocks"
