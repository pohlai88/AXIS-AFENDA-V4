/**
 * @domain shared
 * @layer ui
 * @responsibility Central export point for shadcn block templates
 * @owner afenda/shadcn
 * @dependencies
 * - shadcn/ui primitives (internal)
 * @exports
 * - ERP-ready shadcn blocks (dashboards, sidebars, auth, charts, calendars)
 */

// Dashboards & Layout Blocks
export * from "./app-sidebar"
export * from "./site-header"
export * from "./section-cards"
export * from "./sidebar-left"
export * from "./sidebar-right"
export * from "./sidebar-opt-in-form"
export * from "./settings-dialog"

// Navigation Blocks
export * from "./nav-actions"
export * from "./nav-documents"
export * from "./nav-favorites"
export * from "./nav-main"
export * from "./nav-projects"
export * from "./nav-secondary"
export * from "./nav-user"
export * from "./nav-workspaces"
export * from "./team-switcher"
export * from "./search-form"
export * from "./version-switcher"

// Auth Blocks
export * from "./login-form"
export * from "./signup-form"
export * from "./otp-form"

// Data & Tables
export * from "./data-table"

// Calendar Blocks
export { default as Calendar01 } from "./calendar-01"
export { default as Calendar02 } from "./calendar-02"
export { default as Calendar03 } from "./calendar-03"
export { default as Calendar04 } from "./calendar-04"
export { default as Calendar05 } from "./calendar-05"
export { default as Calendar10 } from "./calendar-10"
export { default as Calendar22 } from "./calendar-22"
export { default as Calendar23 } from "./calendar-23"
export * from "./calendars"
export { DatePicker as BlocksDatePicker } from "./date-picker"

// Chart Blocks
export * from "./chart-area-default"
export * from "./chart-area-interactive"
export * from "./chart-bar-default"
export * from "./chart-line-default"
export * from "./chart-pie-donut"
export * from "./chart-radar-default"
export * from "./chart-radial-simple"
export * from "./chart-tooltip-advanced"