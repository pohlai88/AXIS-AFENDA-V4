# MagicFolder UX spec (Notion-inspired)

All MagicFolder UI is built from **shadcn primitives** and **MagicFolder blocks** only. No hardcoded layout or typography in feature pages.

---

## 1. Sidebar / navigation

- **Hierarchy:** Workspace → Inbox, Duplicates, Unsorted, Search, Collections (same as current routes).
- **Implementation:** Use app sidebar (e.g. `nav-documents` or app-shell) with links to `routes.ui.magicfolder.*`. No custom sidebar component in MagicFolder; links only.

---

## 2. Block structure

### 2.1 Page shell

- **Page:** Generic full-width container (e.g. `space-y-6` or a `Page` block if we add one). Used by every MagicFolder page.
- **PageHeader:** Optional block for title + description + back link / actions. Composed from shadcn (e.g. typography + Button/Link). No raw `h1`/`p` in pages.

### 2.2 List views (Inbox, Search, Unsorted, Collections “by tag” results)

- **MagicfolderToolbar**
  - Left: view title + count (e.g. “Inbox · 12 documents”).
  - Middle: filters — status, docType, hasTags, tagId, sort. Single FilterBar component (Select / Popover / Command from shadcn).
  - Right: actions — Upload (if `canUpload`), Bulk actions when selection exists (Approve, Add tag, Archive when `canBulkTag` / `canBulkArchive`), Sort.
  - Built from: Button, Select, Popover, etc. from `@/components/ui`.

- **MagicfolderDataView**
  - Modes: Table and Card (optional toggle from toolbar).
  - Selection: checkboxes per row/card; “Select all” in toolbar.
  - Empty state: slot for **MagicfolderEmptyState** (see below).
  - Built from: Table or Card list + Checkbox from `@/components/ui`.

- **MagicfolderDocRow / MagicfolderDocCard**
  - Icon/type, title, tags (if any), date, optional owner. Same contract across Inbox, Search, Unsorted, Collections.
  - Built from: Table row or Card + Badge, etc.

- **MagicfolderEmptyState**
  - Per-page message (e.g. “No documents in Inbox”), primary action (e.g. Upload when `canUpload`), optional secondary link (e.g. Search tips).
  - Built from: Card or Section + Button + typography from design tokens.

Pages are thin: `<MagicfolderToolbar />` + `<MagicfolderDataView rows=... rowRenderer=... />` (+ empty state when `rows.length === 0`).

---

## 2.3 Document detail

- **Blocks only:** Title block, metadata block (type, status, dates, version), preview/thumb block (if `hasPreview` / `hasThumbs`), tags block (list + add/remove), versions list.
- **Notion-like:** Clear sections (Card or Section) for each block. No one-off typography in the page file; blocks own styling.
- **Actions:** Download / View source, Preview (if `hasPreview`), Approve (if status is inbox).

---

## 2.4 Duplicates page

- **Group cards:** One card per duplicate group (reason, list of versions). Use **MagicfolderDuplicateGroup** or equivalent block.
- **Per-group actions:** “Keep Best” (suggested version), “Keep this” (per version), and **“Not duplicates”** (dismiss group — optional API).
- Built from: Card, Button, list; no custom layout in page.

---

## 2.5 Upload flow

- **Entry points:** Landing page CTA + Inbox toolbar (when `canUpload`).
- **UI:** shadcn Dialog or Sheet: file input, list of files with progress, “Processing…” after ingest, result summary (e.g. “3 uploaded · 1 duplicate found”).
- **State:** Use existing `lib/client/store/magicfolder-upload.ts`. Drag & drop can be added later.

---

## 3. Empty states

Every list view must have an empty state:

- **Inbox:** “No documents in Inbox” + primary: Upload, secondary: link to Search or tips.
- **Duplicates:** “No duplicate groups” + short explanation (exact SHA-256 duplicates appear here).
- **Search:** “No results” / “Enter a search term or adjust filters” (no primary if no query).
- **Collections:** N/A (collection is a list of links; “By tag” can show “No tags yet” + Create tag).
- **Unsorted:** “No unsorted documents” + explanation (docType=other, no tags).

---

## 4. Affordances driven by registry capabilities

UI shows/hides features based on `magicfolderRegistry.capabilities`:

- **canUpload** — show Upload in toolbar and landing.
- **canBulkTag** — show bulk “Add tag” in Inbox.
- **canBulkArchive** — show bulk “Archive” in Inbox.
- **canResolveDuplicates** — show Keep best / Not duplicates on Duplicates page.
- **hasFTS** — enable full-text search UI (search box + filters).
- **hasPreview** — show Preview button on doc detail.
- **hasThumbs** — show thumbnail in list and/or detail.

Values can come from env or feature flags so the UI never “lies” when the backend turns a feature off.

---

## 5. Reference: components

- **Layout/primitives:** `@/components/ui` (Card, Table, Tabs, Dialog, Sheet, DropdownMenu, Badge, Button, Input, Select, Separator, Skeleton, ScrollArea, Command, Popover, Tooltip, Checkbox, etc.).
- **MagicFolder blocks:** `@/components/magicfolder` — MagicfolderToolbar, MagicfolderDataView, MagicfolderDocRow, MagicfolderDocCard, MagicfolderEmptyState, single FilterBar (status, docType, hasTags, tagId, sort).

No one-off wrappers with custom typography or layout in feature pages; all such layout lives in blocks or `@/components/ui`.
