# MagicFolder UI/UX Refinement — Shadcn Best Practice (Notion-like)

This document captures the **Shadcn MCP–driven refinement** of MagicFolder: primitives and advanced blocks only, dashboard patterns, and layout comparable to **Notion**. All UI is built from **shadcn primitives** and **MagicFolder blocks**; no hardcoded layout or typography in feature pages.

---

## 1. Shadcn registry reference

- **Registry:** `@shadcn` (configured in `components.json`).
- **Primitives:** Card, Table, Tabs, Dialog, Sheet, DropdownMenu, Badge, Button, Input, Select, Separator, Skeleton, ScrollArea, Command, Popover, Tooltip, Checkbox, **Empty** (EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia), Breadcrumb, Sidebar.
- **Blocks:** `dashboard-01` (sidebar + charts + data table), `sidebar-01`–`sidebar-16` (navigation, collapsible, sticky header, etc.).

---

## 2. Shadcn best practices applied

### 2.1 Empty state (from `empty-demo`)

- Use **Empty** as root; **EmptyHeader** for title/description; **EmptyMedia** with `variant="icon"` for icon.
- Put **primary actions** in **EmptyContent** (e.g. `flex gap-2` buttons).
- Put **secondary link** outside EmptyHeader (e.g. `Button variant="link"` with `Learn more`).
- **MagicfolderEmptyState** follows this: Card → Empty → EmptyHeader (EmptyMedia, EmptyTitle, EmptyDescription) + EmptyContent (primary) + optional link.

### 2.2 Page shell (Notion-like)

- **Page:** Full-width container with consistent vertical rhythm (`space-y-6` or block-owned spacing). Used by every MagicFolder page.
- **PageHeader:** Title + description + actions. Composed from shadcn typography tokens only (e.g. `text-2xl font-semibold tracking-tight`, `text-muted-foreground`). No raw `h1`/`p` in pages — only inside **MagicfolderPageHeader**.
- **Sidebar:** Use app sidebar (e.g. `nav-documents` or app-shell) with links to `routes.ui.magicfolder.*`. Reference blocks: `sidebar-01` (grouped sections), `sidebar-16` (sticky site header). No custom sidebar in MagicFolder; links only.

### 2.3 List views (Inbox, Search, Unsorted, Collections)

- **MagicfolderToolbar:** Left = view title + count; middle = FilterBar (Select/Popover/Command); right = Upload, bulk actions, view toggle. Built from Button, Select, etc.
- **MagicfolderDataView:** Table + Card modes, selection (Checkbox), empty state slot. Built from Table, Card, Checkbox.
- **MagicfolderDocRow / MagicfolderDocCard:** Icon, title, tags, date. Same contract everywhere. Built from Table row or Card + Badge.

### 2.4 Document detail (Notion-like blocks)

- **Blocks only:** Title block, metadata block (type, status, dates), preview/thumb block, tags block, versions list. Each block = Card or Section; no one-off typography in page files.

### 2.5 Dashboard alignment

- **dashboard-01:** Sidebar + main content + data table. MagicFolder list pages mirror this: sidebar (app-level) + main = Toolbar + DataView (table/grid).
- Layout: **SidebarProvider** (app shell) + main area with **MagicfolderPageHeader** + **MagicfolderToolbar** + **MagicfolderDataView** or **MagicfolderEmptyState**.

---

## 3. Component → Shadcn mapping

| MagicFolder block         | Shadcn primitives / pattern                                                      |
| ------------------------- | -------------------------------------------------------------------------------- |
| MagicfolderPage           | Full-width container, `space-y-6`                                                |
| MagicfolderPageHeader     | Section, typography tokens (no raw h1/p in pages)                                |
| MagicfolderToolbar        | Button, Select, Popover, optional Command                                        |
| MagicfolderFilterBar      | Select, Button (Clear filters)                                                   |
| MagicfolderDataView       | Card, Table, Checkbox, optional Tabs (view mode)                                 |
| MagicfolderDocRow/Card    | TableRow/TableCell, Card, Badge, Checkbox                                        |
| MagicfolderEmptyState     | Card, Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent |
| MagicfolderSection        | Section, optional Card; layout = stack/grid/flex                                 |
| MagicfolderNavLinks       | Link, text-primary, text-muted-foreground                                        |
| MagicfolderUploadDialog   | Dialog or Sheet, Button, progress (if needed)                                    |
| MagicfolderDuplicateGroup | Card, Button list                                                                |

---

## 4. Package and layout (Notion-comparable)

- **Package:** `@/components/magicfolder` — all blocks; `@/components/ui` — shadcn only.
- **Layout:** App shell provides sidebar (or nav); each MagicFolder page is:
  1. **MagicfolderPage** (optional wrapper)
  2. **MagicfolderPageHeader** (title, description, actions)
  3. Context-specific: **MagicfolderToolbar** + **MagicfolderDataView** + **MagicfolderEmptyState** when empty, **or** detail blocks (Section/Card per block).
- **No** raw `h1`/`h2`/`p` with custom classes, no direct `flex`/`grid` for page structure, no custom toolbars/filter bars in pages — only composition of blocks and shadcn primitives.

---

## 5. Audit alignment

- **Banned in pages:** Raw headings/paragraphs with custom typography; one-off `text-*`/`font-*`/spacing in pages; direct flex/grid for page structure; custom toolbars/filter bars; duplicated FilterBar; raw button styling.
- **Allowed:** Layout blocks and shadcn primitives; inside blocks: `gap-*`, `w-full`, layout utilities; design tokens (`text-muted-foreground`, etc.) within blocks. Pages only **compose** blocks.

This spec is the reference for implementing and refining the actual MagicFolder package and layout using Shadcn MCP and shadcn best practices.
