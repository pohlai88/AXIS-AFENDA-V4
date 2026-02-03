# MagicFolder plan audit — left out / remaining

Audit of the MagicFolder integration plan (magicfolder_integration_analysis_84cdc9c3.plan.md) against the current codebase. All plan todos are marked completed; this doc captures **gaps and remaining work** for full plan compliance.

---

## 1. Remaining (plan-specified, not done)

| Item                                 | Plan reference                                                                                                                                    | Current state                                                                                                                   | Action                                                                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **“Not duplicates” (dismiss group)** | Phase 3 Duplicates: “Keep best + **Not duplicates** (dismiss group) per group”; UX spec §2.4 “**Not duplicates** (dismiss group — optional API)”. | Duplicates page has “Keep Best” / “Keep this” only. No “Not duplicates” button or API.                                          | Add “Not duplicates” action per group (optional API: e.g. `POST …/dismiss-duplicate-group` or mark group as “not duplicates”) and wire DuplicateGroup block. |
| **Inbox empty state primary action** | UX spec §3: Inbox empty state “primary: Upload”.                                                                                                  | Inbox `MagicfolderEmptyState` has no `primaryAction`; Upload is only in header.                                                 | Pass `primaryAction={<MagicfolderUploadDialog trigger={<Button>Upload</Button>} />}` to Inbox (and Unsorted if desired) empty state.                         |
| **View mode toggle (list / card)**   | Plan §5: MagicfolderDataView “Table mode + Card mode”; UX spec “optional toggle from toolbar”.                                                    | `MagicfolderDataView` reads `viewMode` from `useMagicfolderSearchStore` (list/grid) but **no UI toggle** exists.                | Add list/grid toggle to toolbar or page (e.g. in MagicfolderToolbar `actions` or Inbox/Search header) that calls `setViewMode("list" \| "grid")`.            |
| **Registry capabilities from env**   | Plan §10 Reference: “Values can be **derived from env or feature flags** so UI does not ‘lie’ when backend turns features off.”                   | `magicfolderRegistry.capabilities` are static `true`.                                                                           | (Optional) Derive capabilities from env (e.g. `NEXT_PUBLIC_MAGICFOLDER_UPLOAD`) or feature flags and use in toolbar/doc detail.                              |
| **Capability gating on doc detail**  | UX spec §4: “**hasPreview** — show Preview button on doc detail”; “**hasThumbs** — show thumbnail in list and/or detail.”                         | Doc detail always shows Preview button and thumbnail; not gated by `magicfolderRegistry.capabilities.hasPreview` / `hasThumbs`. | (Optional) If capabilities are dynamic, gate Preview button with `hasPreview` and thumb block with `hasThumbs`.                                              |

---

## 2. Partial / alternative implementation (acceptable)

| Item              | Plan reference                                                                                 | Current state                                                                                                                                           | Note                                                                                                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inbox toolbar** | Plan Phase 3: “MagicfolderToolbar + MagicfolderDataView”.                                      | Inbox uses **MagicfolderPageHeader** + **MagicfolderFilterBar** + **MagicfolderDataView** (not the single `MagicfolderToolbar` block).                  | Same elements (title, filters, Upload, bulk in DataView); different composition. Using Toolbar block on Inbox would unify layout; current approach is acceptable if we treat PageHeader+FilterBar as equivalent. |
| **Sidebar**       | Plan §3 Benchmark: “Sidebar: Clear hierarchy (e.g. workspace → Inbox / Search / Collections)”. | App sidebar (`app-sidebar.tsx`) already shows MagicFolder links (Landing, Inbox, Duplicates, Unsorted, Search, Collections) when on MagicFolder routes. | Implemented at app level; no separate MagicFolder sidebar component.                                                                                                                                             |

---

## 3. Docs to update (stale)

| Doc                                       | Issue                                                                                                   | Action                                                                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **docs/magicfolder-ui-audit-patterns.md** | “Current violations” table still describes **pre–Phase 3** state (raw h1/p, duplicate FilterBar, etc.). | Update table: mark violations as **resolved** as of Phase 3 rebuild, or remove and add “No current violations in feature pages; layout lives in blocks.” |
| **docs/magicfolder-ux-spec.md**           | §2.4 mentions “Not duplicates (dismiss group — optional API)” which is not implemented.                 | Either add “(Not yet implemented)” or leave as spec for future work.                                                                                     |

---

## 4. Summary

- **Must-have for full plan compliance:** “Not duplicates” (dismiss group) action + API (optional per spec); Inbox empty state primary action = Upload; view mode toggle (list/card) in UI.
- **Nice-to-have:** Capabilities from env/feature flags; capability gating of Preview/Thumbs on doc detail.
- **Docs:** Refresh `magicfolder-ui-audit-patterns.md` violations; optionally clarify “Not duplicates” in UX spec.

All 5 phases are **done** per the plan todos; the items above are **remaining enhancements** to match the written spec and benchmark fully.
