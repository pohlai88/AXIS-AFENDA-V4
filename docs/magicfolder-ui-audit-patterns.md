# MagicFolder UI: Banned and Allowed Patterns

**Definition lock:** No hardcoded UI in feature pages — only layout blocks + shadcn primitives.

---

## Banned patterns (feature pages)

Feature pages live under `app/(app)/app/magicfolder/` (landing, inbox, documents/[id], duplicates, search, collections, unsorted). The following are **not allowed** in these pages:

1. **Raw typography with custom classes**
   - Using raw `<h1>`, `<h2>`, `<p>` with custom Tailwind classes (e.g. `text-2xl font-semibold tracking-tight`, `text-muted-foreground`) in the page file. These must live in **blocks** (e.g. `PageHeader`, `Section`).

2. **Typography/color/spacing utilities in pages**
   - `text-[13px]`, `text-2xl`, `font-semibold`, `font-medium`, `mt-[14px]`, bespoke gradients, or any one-off `text-*` / `font-*` in feature page JSX. Pages must compose blocks that own typography.

3. **Direct layout in pages**
   - Direct `flex` / `grid` in feature pages for page-level structure (e.g. `className="flex items-center justify-between"` for the header area, `className="grid gap-4 md:grid-cols-2"` for the main content). Only **layout blocks** (e.g. `Page`, `PageHeader`, `Section`, `Stack`, `Toolbar`, `DataView`) may own layout.

4. **Inventing toolbars/filter bars in pages**
   - Feature pages must not implement their own toolbar or filter bar layout. Use `<MagicfolderToolbar />` and the single FilterBar from `@/components/magicfolder`.

5. **Duplicated FilterBar**
   - There must be only one FilterBar implementation (in `@/components/magicfolder`). The inbox-local `MagicfolderFilterBar.tsx` under `app/.../inbox/_components/` is duplicated and must be removed in favor of the canonical block.

6. **Custom search button styling**
   - Using raw `className="rounded-md border bg-primary ..."` for buttons instead of shadcn `<Button>`.

---

## Allowed patterns

### In layout blocks and canonical MagicFolder blocks

- **Layout wrappers:** `Page`, `PageHeader`, `Section`, `Stack`, `Toolbar`, `DataView` — these own layout and may use `flex`, `grid`, `gap-*`, `space-y-*` as needed.
- **shadcn primitives only:** Card, Table, Tabs, Dialog, Sheet, DropdownMenu, Badge, Button, Input, Select, Separator, Skeleton, ScrollArea, Command, Popover, Tooltip, Checkbox, etc. from `@/components/ui`.
- **Inside blocks:** Utility classes such as `gap-*`, `w-full`, `min-w-0`, `flex-1` are allowed **inside** block components to achieve layout. Typography and color should use design tokens (e.g. `text-muted-foreground`) within blocks, not ad-hoc pixel values.

### In feature pages (after refactor)

- **Composition only:** Pages render only block components and shadcn primitives where a block does not exist (e.g. `<MagicfolderToolbar />`, `<MagicfolderDataView rows=... />`, `<MagicfolderEmptyState />`). No direct `h1`/`h2`/`p` with custom classes; no direct `flex`/`grid` for page structure.

---

## Current violations (audit snapshot)

| Location | Violation |
|----------|-----------|
| `app/.../magicfolder/page.tsx` | Raw `h1`/`p` with `text-2xl font-semibold`, `text-muted-foreground`; `div` with `space-y-6`, `grid gap-4 md:grid-cols-2`, `flex flex-wrap gap-2` |
| `app/.../magicfolder/inbox/page.tsx` | Raw `h1`/`p`; `div` with `flex items-center justify-between`; inline toolbar (CardHeader + Checkbox + Buttons) instead of MagicfolderToolbar; list layout in page |
| `app/.../magicfolder/documents/[id]/page.tsx` | Raw `h1`/`p`; `div` with `flex items-center gap-2`, `space-y-6`; metadata/tags layout in page |
| `app/.../magicfolder/duplicates/page.tsx` | Raw `h1`/`p`; `div` with `flex items-center justify-between`, `space-y-4`; custom card layout in page |
| `app/.../magicfolder/search/page.tsx` | Raw `h1`/`p`; raw `<button>` with custom classes; `div` with `flex gap-2`, `flex items-center justify-between`; list in page |
| `app/.../magicfolder/collections/page.tsx` | Raw `h1`/`h2`/`p`; `div` with `grid gap-4 md:grid-cols-2`, `mb-3 text-sm font-medium text-muted-foreground` |
| `app/.../magicfolder/unsorted/page.tsx` | Raw `h1`/`p`; `div` with `flex items-center justify-between`; list in page |
| `app/.../inbox/_components/MagicfolderFilterBar.tsx` | Duplicate FilterBar; should be single source in `@/components/magicfolder` |
| `components/magicfolder/filter-bar.tsx` | Missing `hasTags` and `tagId` filters (inbox version has them) — consolidate to one FilterBar with status, docType, hasTags, tagId, sort |

---

## Summary

- **Banned in pages:** Raw headings/paragraphs with custom typography; `text-*`/`font-*`/one-off spacing in pages; direct flex/grid for page structure; custom toolbars/filter bars; duplicated FilterBar; raw button styling.
- **Allowed:** Layout blocks and shadcn primitives; inside blocks: `gap-*`, `w-full`, and similar layout utilities; design tokens for typography/color within blocks. Pages only **compose** blocks.
