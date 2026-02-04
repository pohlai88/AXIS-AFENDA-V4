# MagicFolder Plan Audit – What’s Missing

## Implemented (per plan)

- **Gaps 1–12:** Addressed (base URL, upload config, preferences unique constraint, tags logger, document card status, DELETE/duplicate/export routes, settings Tags + Organization, sidebar Settings/Audit, R2 guard on upload/presign/source-url, health endpoint, audit page, single `objectById` route).
- **Zustand:** Persist middleware, pathname → `setFilters` in DocumentHub, selective subscriptions.
- **Phases 1–6:** Done as specified (foundation, state/routing, shadcn audit, wiring/APIs, polish, settings with constants).

---

## Missing or incomplete

### 1. Hub not using default filters from preferences (Phase 6) — **DONE**

- **Plan:** *“Default filters: … Expose both in settings as selects and persist via preferences API (or quickSettings); **ensure list API and hub use these defaults when present**.”*
- **Done:** DocumentHub now fetches preferences when pathname is the landing page and applies `quickSettings.defaultStatusFilter` and `quickSettings.defaultDocTypeFilter` to filters so the list opens with the user’s chosen defaults.

### 2. Organization tab: no UI for `allowedFileTypes` (Phase 6) — **DONE**

- **Plan:** *“Limits: … **allowedFileTypes** (multi-select or checklist from `ALLOWED_MIME_TYPES` or tenant override).”*
- **Done:** In the Organization tab → Limits & Quotas, added an “Allowed file types” checklist using `ALLOWED_MIME_TYPES`; each MIME type can be toggled and is persisted with tenant settings.

### 3. Duplicates sub-page not showing “duplicate groups” (Gap 8) — **DONE**

- **Plan:** *“Map path segments to filter state: … **duplicates → filter or view for duplicate groups**.”*
- **Done:** The duplicates page now renders `DuplicateGroupsView` instead of DocumentHub: it lists duplicate groups from the duplicate-groups API and, when a group is selected, shows documents in that group via the list API with `dupGroup` param.

### 4. Saved views section in settings (Phase 6 – optional) — **DONE**

- **Plan:** *“Add a ‘Saved views’ section: **if the saved-views API supports create/update/delete**, list saved views and allow setting a default; otherwise omit.”*
- **Done:** Added a “Saved views” tab in MagicFolder settings: list saved views (GET), “Add saved view” dialog (name, description, set as default → POST), “Set as default” (PUT), delete (DELETE). Load on mount and after create/update/delete.

### 5. Custom hooks for data (best practices) — **DONE**

- **Plan:** *“Custom hooks for data and side effects: e.g. **`useDocuments(filters, pagination)`**, **`useTags()`** that call API and update store or return data.”*
- **Done:** Added `useDocuments(filters, options)` in `lib/client/hooks/use-magicfolder-documents.ts` (fetches list API and updates hub store). Added `useTags()` in `lib/client/hooks/use-magicfolder-tags.ts` (fetches tags API, returns tags + refetch). DocumentHub now uses `useDocuments` for fetching.

### 6. Route-derived slice / `initialFilterFromRoute` (Zustand) — **DONE**

- **Plan:** *“Add a small slice for **route-derived initial state** (e.g. **`initialFilterFromRoute`**) so sub-pages … can sync the current path into the hub store on mount.”*
- **Done:** Added `initialFilterFromRoute` and `setInitialFilterFromRoute` to the hub store (not persisted). DocumentHub pathname effect now sets this slice and then `setFilters(routeFilter)` so route-derived filter is explicit in the store.

### 7. Audit/hash when R2 is not configured — **DONE**

- **Plan:** R2 guard is required for upload, presign, and source-url; audit is not explicitly included.
- **Done:** In `app/api/v1/(magicfolder)/magicfolder/audit/hash/route.ts`, call `isR2Configured()` at the start and return 503 with “Storage not configured” when R2 is not configured.

### 8. Preferences PUT and `quickSettings` merge — **DONE**

- **Plan:** Persist default filters in quickSettings; no explicit requirement to merge.
- **Done:** In preferences PUT, when `body.quickSettings` is present, fetch existing row and set `quickSettingsToSet = { ...existingQs, ...body.quickSettings }` so other keys are preserved.

---

## Summary table

| Item                                                  | Priority       | Status   |
| ----------------------------------------------------- | -------------- | -------- |
| Hub uses default status/doc type from preferences     | High           | **Done** |
| Organization: allowedFileTypes multi-select/checklist | High           | **Done** |
| Duplicates page = duplicate groups view/filter        | Medium         | **Done** |
| Saved views section in settings                       | Low (optional) | **Done** |
| useDocuments / useTags hooks                          | Low (optional) | **Done** |
| initialFilterFromRoute slice                          | Low (optional) | **Done** |
| Audit/hash R2 guard (503 when not configured)         | Low (optional) | **Done** |
| Merge quickSettings on preferences PUT                | Low (optional) | **Done** |

All items from the MagicFolder plan audit are now implemented.