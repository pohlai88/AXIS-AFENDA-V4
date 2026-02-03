# Lint Warnings and Suggested Fixes

**React/Next.js–related warnings have been fixed** per [Next.js composition patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns) and [React docs](https://react.dev/learn/you-might-not-need-an-effect):

| Fix                         | Location                                   | What we did                                                                                                                                                                              |
| --------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **useCallback + deps**      | `app/(app)/app/settings/sessions/page.tsx` | Wrapped `loadSessions` in `useCallback([toast])` and added it to `useEffect` deps; removed unused `router` and `useRouter` import.                                                       |
| **useMemo for stable deps** | `lib/client/hooks/useFeatureFlags.ts`      | Replaced `const flags = {}` with `useMemo(() => ({}), [])` so `useCallback` deps don’t change every render.                                                                              |
| **Third-party API**         | `components/data-table.tsx`                | Added `eslint-disable-next-line react-hooks/incompatible-library` with a comment: TanStack Table’s `useReactTable()` is used inside a Client Component per Next.js third-party guidance. |

Remaining warnings (42) are mostly `@typescript-eslint/no-unused-vars`. List below grouped by type with suggested solutions.

---

## 1. Unused variables / imports (`@typescript-eslint/no-unused-vars`)

| File                                                    | Line          | Item                                                              | Suggested fix                                                                                             |
| ------------------------------------------------------- | ------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `app/(app)/_components/nav-user.tsx`                    | 6             | `IconCreditCard`                                                  | Remove from import or use it in the UI.                                                                   |
| `app/(app)/app/magicfolder/page.tsx`                    | 14            | `FileText`                                                        | Remove from lucide-react import.                                                                          |
| `app/(app)/app/settings/sessions/page.tsx`              | 88            | `router`                                                          | Remove if unused, or use for navigation; else prefix: `_router`.                                          |
| `app/(public)/(auth)/auth/[path]/page.tsx`              | 15            | `authClient`                                                      | Remove or use; else prefix: `_authClient`.                                                                |
| `app/(public)/(auth)/verify-email/page.tsx`             | 37            | `AUTH_LOADING_STATES`                                             | Remove import or use in component.                                                                        |
| `app/(public)/_components/footer.tsx`                   | 1, 2          | `Link`, `BarChart3`                                               | Remove unused imports.                                                                                    |
| `app/api/orchestra/(orchestra)/approvals/[id]/route.ts` | 13            | `BadRequest`                                                      | Remove from destructuring/import if not used.                                                             |
| `app/api/v1/(magictodo)/projects/[id]/route.ts`         | 13            | `BadRequest`                                                      | Same as above.                                                                                            |
| `app/api/v1/(magictodo)/tasks/[id]/route.ts`            | 13            | `BadRequest`                                                      | Same as above.                                                                                            |
| `components/auth/auth-shell.tsx`                        | 61, 62        | `metaTitle`, `metaDescription`                                    | Use in metadata/head or remove; else prefix: `_metaTitle`, `_metaDescription`.                            |
| `lib/client/hooks/useFeatureFlags.ts`                   | 35, 40        | `_feature`                                                        | Already prefixed; ensure param is required by API or remove from destructuring.                           |
| `lib/client/hooks/usePermissions.ts`                    | 22, 25        | `_context`, `_permission`                                         | Keep `_` prefix (convention for unused); lint may need rule override for destructuring.                   |
| `lib/client/store/magicfolder-duplicates.ts`            | 24            | `get` in `(set, get)`                                             | Rename to `_get` (Zustand passes it; we don't use it).                                                    |
| `lib/client/store/magicfolder-upload.ts`                | 48            | `get` in `(set, get)`                                             | Same: rename to `_get`.                                                                                   |
| `lib/contracts/organizations.ts`                        | 2             | `PERMISSIONS`                                                     | Remove import or use; else re-export for consumers.                                                       |
| `lib/server/auth/token-refresh.ts`                      | 17, 49        | `NextRequest`, `token`                                            | Remove or use; else prefix: `_NextRequest`, `_token`.                                                     |
| `lib/server/magicfolder/classify.ts`                    | 69            | `_input`                                                          | Already prefixed; if lint still warns, use `_input` in a void expression or add eslint-disable-next-line. |
| `lib/server/magicfolder/ingest.ts`                      | 15, 16        | `magicfolderDuplicateGroupVersions`, `magicfolderDuplicateGroups` | Remove from import (only used in other modules).                                                          |
| `lib/server/magicfolder/keep-best.ts`                   | 32            | `_ownerId`                                                        | Keep `_`; add eslint-disable-next-line if needed for required param.                                      |
| `lib/server/magicfolder/ocr.ts`                         | 51, 52        | `_buffer`, `_mimeType`                                            | Destructuring for signature; rename to `_buffer`, `_mimeType` if not already.                             |
| `lib/utils/auth.ts`                                     | 1, 3          | `redirect`, `STORAGE_KEYS`, `TIME_INTERVALS`                      | Remove unused imports.                                                                                    |
| `scripts/audit-route-registry.mjs`                      | 126, 128      | `filename`, `isApi`                                               | Remove from destructuring or use; else prefix with `_`.                                                   |
| `scripts/validate-neon-auth-credentials.mjs`            | 245, 262, 264 | `config`, `missingOAuth`, `config`                                | Use variables or remove; for required destructuring use `_config`.                                        |
| `tests/e2e/brute-force.spec.ts`                         | 80, 225, 267  | `page`, `context`                                                 | Prefix with `_` (e.g. `_page`, `_context`) if callback signature requires them.                           |
| `tests/e2e/token-refresh.spec.ts`                       | 17, 31, 36    | `refreshPromise`, `page`                                          | Same: use or prefix with `_`.                                                                             |
| `tests/unit/rate-limit.test.ts`                         | 205           | `oldAttempt`                                                      | Use in assertion or rename to `_oldAttempt`.                                                              |

---

## 2. React Hooks

### 2.1 Missing dependency (`react-hooks/exhaustive-deps`) — **FIXED**

| File                                       | Line           | Issue                                                        | Suggested fix                                                                                                                                     |
| ------------------------------------------ | -------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(app)/app/settings/sessions/page.tsx` | 98             | `useEffect` missing `loadSessions`                           | Add `loadSessions` to dependency array: `[loadSessions]`. If `loadSessions` is stable (e.g. from useCallback with correct deps), this is safe.    |
| `lib/client/hooks/useFeatureFlags.ts`      | 15, 20, 26, 32 | `flags` object changes every render, breaks useCallback deps | Initialize `flags` inside `useMemo(() => ({ ... }), [])` (or with real deps) so the same reference is used; then use `flags` in useCallback deps. |

### 2.2 Incompatible library (`react-hooks/incompatible-library`) — **FIXED**

| File                        | Line | Issue                                              | Suggested fix                                                                                                                                                                |
| --------------------------- | ---- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/data-table.tsx` | 368  | `useReactTable()` returns non-memoizable functions | Expected with TanStack Table. Options: (1) Add eslint-disable-next-line with a short comment; (2) Or configure React Compiler to ignore this call site if your setup allows. |

---

## 3. Unescaped entity (`react/no-unescaped-entities`)

*(Already fixed: auth/callback apostrophe → `&apos;`.)*

No remaining warnings in this category.

---

## Summary by fix type

- **Remove unused import or variable** – Most of the “defined but never used” warnings: delete the import or the variable, or use it.
- **Prefix with `_` for intentionally unused** – Required callback params (e.g. Zustand `get`, test args): use `_get`, `_page`, `_context`, etc.
- **Add missing dependency** – sessions page: add `loadSessions` to `useEffect` deps; useFeatureFlags: stabilize `flags` with `useMemo` and use in `useCallback` deps.
- **One-off disable** – data-table.tsx: add a single eslint-disable-next-line for `useReactTable` with a brief comment that TanStack Table’s API is incompatible with the rule.

---

## 4. Applied: unused imports / variables (no perf impact)

**Removed unused imports** (safe, no behavior change):

- `nav-user.tsx` — removed `IconCreditCard`
- `magicfolder/page.tsx` — removed `FileText`
- `auth/[path]/page.tsx` — removed `authClient`
- `verify-email/page.tsx` — removed `AUTH_LOADING_STATES`
- `footer.tsx` — removed `Link`, `BarChart3`
- `approvals/[id]/route.ts`, `projects/[id]/route.ts`, `tasks/[id]/route.ts` — removed `BadRequest`
- `ingest.ts` — removed `magicfolderDuplicateGroupVersions`, `magicfolderDuplicateGroups`
- `organizations.ts` — removed `PERMISSIONS`
- `auth.ts` — removed `redirect`, `STORAGE_KEYS`, `TIME_INTERVALS`
- `token-refresh.ts` — removed `NextRequest` from type import

**Renamed to `_` (signature/API unchanged, lint-only):**

- Zustand: `magicfolder-duplicates.ts`, `magicfolder-upload.ts` — `(set, get)` → `(set, _get)`
- `auth-shell.tsx` — destructure `metaTitle: _metaTitle`, `metaDescription: _metaDescription`
- `token-refresh.ts` — `token` → `_token`
- Scripts: `audit-route-registry.mjs`, `validate-neon-auth-credentials.mjs` — unused loop/assign vars → `_` prefix
- Tests: `brute-force.spec.ts`, `token-refresh.spec.ts`, `rate-limit.test.ts` — unused callback/assign vars → `_` prefix

**Result:** 42 → 26 warnings. No errors.

---

## 5. Left for next solution (may affect API / behavior)

These are **intentionally unused** (required by callback signature, public API, or future use). Removing or changing them could affect behavior or performance; handle in a follow-up (e.g. ESLint rule `argsIgnorePattern: "^_"` or targeted `eslint-disable-next-line`):

| File                                                 | Item                                                  | Reason                                                    |
| ---------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| `auth-shell.tsx`                                     | `_metaTitle`, `_metaDescription`                      | Props part of public API; reserved for metadata           |
| `useFeatureFlags.ts`                                 | `_feature` (2)                                        | Callback signature; callers pass `enableFeature(feature)` |
| `usePermissions.ts`                                  | `_context`, `_permission`                             | Callback params; API contract                             |
| `magicfolder-duplicates.ts`, `magicfolder-upload.ts` | `_get`                                                | Zustand passes `(set, get)`; we don’t use `get`           |
| `token-refresh.ts`                                   | `_token`                                              | Assigned for clarity; may be used later                   |
| `classify.ts`                                        | `_input`                                              | Function signature for `suggestTags`                      |
| `keep-best.ts`                                       | `_ownerId`                                            | Required by `setKeepBest` signature                       |
| `ocr.ts`                                             | `_buffer`, `_mimeType`                                | Required by `extractTextFromBuffer` signature             |
| Scripts (`.mjs`)                                     | `_config`, `_filename`, `_isApi`, `_missingOAuth`     | Loop destructuring; names document intent                 |
| Tests                                                | `_page`, `_context`, `_refreshPromise`, `_oldAttempt` | Test callback params or documented fixtures               |

Applying the quick fixes (removing unused imports and renaming unused params to `_`) across the codebase cleared 16 warnings; the rest are above and left for next solution.

---

## 6. Individual analysis of remaining 26 warnings (with proposed solution)

Each remaining warning is listed with context, options, and recommended fix.

### 6.1 `components/auth/auth-shell.tsx` (2 warnings)

| Line | Variable           | Context                                                                            | Options                                                                                                                | **Recommended**                                                                                                                                                                       |
| ---- | ------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 61   | `_metaTitle`       | Prop destructured from `AuthShellProps`; reserved for future `<title>` / metadata. | A) Use in `<title>` or `<meta name="description">` when implementing metadata. B) Ignore via ESLint (keep `_` prefix). | **B** — Props are part of public API (JSDoc shows `metaTitle`, `metaDescription`). Using them now would require a layout or `generateMetadata`; until then, ignore `_`-prefixed vars. |
| 62   | `_metaDescription` | Same.                                                                              | Same.                                                                                                                  | **B**                                                                                                                                                                                 |

**Reasoning:** The component’s contract intentionally accepts these props for future use. Removing them would break the API; using them now is a feature. Ignoring `_`-prefixed identifiers is the right fix.

---

### 6.2 `lib/client/hooks/useFeatureFlags.ts` (2 warnings)

| Line | Variable   | Context                                                                                                                   | Options                                                                                               | **Recommended**                                    |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 35   | `_feature` | Parameter of `enableFeature(_feature)`. Callers use `enableFeature(feature)`; implementation is a stub (returns `false`). | A) Remove param — breaks `useFeatureFlag` which calls `enableFeature(feature)`. B) Ignore via ESLint. | **B** — Signature must stay for API compatibility. |
| 40   | `_feature` | Same for `disableFeature(_feature)`.                                                                                      | Same.                                                                                                 | **B**                                              |

**Reasoning:** The hook’s public API is `enableFeature(feature: FeatureFlagValue)` and `disableFeature(feature)`. Changing the signature would break call sites. Ignore `_`-prefixed args.

---

### 6.3 `lib/client/hooks/usePermissions.ts` (2 warnings)

| Line | Variable      | Context                                                                          | Options                                                          | **Recommended** |
| ---- | ------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------- |
| 22   | `_context`    | Optional param `usePermissions(_context?)`; strict mode doesn’t use context yet. | A) Remove param — would change public API. B) Ignore via ESLint. | **B**           |
| 25   | `_permission` | Param of `hasPermission(_permission)`; stub returns `false`.                     | Same.                                                            | **B**           |

**Reasoning:** Both are part of the hook’s public API for future server-backed permissions. Ignore `_`-prefixed.

---

### 6.4 `lib/client/store/magicfolder-duplicates.ts` (1 warning)

| Line | Variable | Context                                                                                            | Options                                                                                                     | **Recommended**                                                  |
| ---- | -------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 24   | `_get`   | Zustand `create((set, get) => ...)`. API always passes `(set, get)`; this store doesn’t use `get`. | A) Omit second param — Zustand still passes it, so you’d get a different formal name. B) Ignore via ESLint. | **B** — Convention is to keep `(set, _get)` so the API is clear. |

**Reasoning:** Zustand’s type expects two arguments. Keeping `_get` documents “we don’t use get”; ESLint should not flag `_`-prefixed args.

---

### 6.5 `lib/client/store/magicfolder-upload.ts` (1 warning)

| Line | Variable | Context      | Options | **Recommended**              |
| ---- | -------- | ------------ | ------- | ---------------------------- |
| 48   | `_get`   | Same as 6.4. | Same.   | **B** — Ignore `_`-prefixed. |

---

### 6.6 `lib/server/auth/token-refresh.ts` (1 warning)

| Line | Variable | Context                                                                                    | Options                                                                                                                                                                                                      | **Recommended**                                                                                                           |
| ---- | -------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| 49   | `_token` | Assigned from `sessionData.session.token`; only `expiresAt` is used for the refresh check. | A) Remove assignment and only read `sessionData.session?.expiresAt` — token is still present for “session exists” check. B) Use token later (e.g. pass to refresh call) and keep name. C) Ignore via ESLint. | **C** — Keeping the assignment documents “we have the token”; a future refactor might use it. No need to change behavior. |

**Reasoning:** The variable names the value that could be used for refresh; removing it doesn’t simplify logic. Ignore `_`-prefixed vars.

---

### 6.7 `lib/server/magicfolder/classify.ts` (1 warning)

| Line | Variable | Context                                                                                                    | Options                                                                                 | **Recommended**                                            |
| ---- | -------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 69   | `_input` | Param of `suggestTags(_input: ClassifyInput)`; stub returns `[]`. `classify()` calls `suggestTags(input)`. | A) Remove param — would break `classify()` and the function type. B) Ignore via ESLint. | **B** — Signature must match `ClassifyResult` and callers. |

**Reasoning:** Public API and `classify()` depend on the parameter. Ignore `_`-prefixed args.

---

### 6.8 `lib/server/magicfolder/keep-best.ts` (1 warning)

| Line | Variable   | Context                                                                                                                                                    | Options                                                             | **Recommended** |
| ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------- |
| 32   | `_ownerId` | Fourth parameter of `setKeepBest(groupId, versionId, tenantId, ownerId)`. Callers (e.g. API) pass owner for auth/audit; implementation doesn’t use it yet. | A) Remove param — would break all call sites. B) Ignore via ESLint. | **B**           |

**Reasoning:** Parameter is part of the public API and may be used for auth or audit later. Ignore `_`-prefixed.

---

### 6.9 `lib/server/magicfolder/ocr.ts` (2 warnings)

| Line | Variable    | Context                                                                            | Options                                                                                       | **Recommended** |
| ---- | ----------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------- |
| 51   | `_buffer`   | Param of `extractTextFromBuffer(_buffer, _mimeType)`; stub returns `{ text: "" }`. | A) Remove params — would break the function type and any future caller. B) Ignore via ESLint. | **B**           |
| 52   | `_mimeType` | Same.                                                                              | Same.                                                                                         | **B**           |

**Reasoning:** Signature documents the future implementation (buffer + MIME). Ignore `_`-prefixed args.

---

### 6.10 `scripts/audit-route-registry.mjs` (2 warnings)

| Line | Variable    | Context                                                                                                       | Options                                                                                                     | **Recommended**                                                      |
| ---- | ----------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 126  | `_filename` | `const _filename = parts.pop()` — need `parts.pop()` for side effect (mutate `parts`); filename not used.     | A) Call `parts.pop()` without assigning — removes warning but loses documenting name. B) Ignore via ESLint. | **B** — Keeping the name documents intent; ESLint should ignore `_`. |
| 128  | `_isApi`    | `const _isApi = parts[0] === "api" ...` — computed but not used; comment says “UI: ignore the api namespace”. | A) Remove — logic is unused today. B) Ignore via ESLint.                                                    | **B** — Name documents why the logic exists for future use.          |

**Reasoning:** Both names document intent; the side effect or future use is the point. Ignore `_`-prefixed vars.

---

### 6.11 `scripts/validate-neon-auth-credentials.mjs` (3 warnings)

| Line | Variable        | Context                                                                             | Options                                                                                             | **Recommended** |
| ---- | --------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------- |
| 245  | `_config`       | `for (const [key, _config] of Object.entries(OPTIONAL_VARS))` — only `key` is used. | A) Use `_` only: `const [key]` — but then we lose the “config” documentation. B) Ignore via ESLint. | **B**           |
| 262  | `_missingOAuth` | `const _missingOAuth = []` — array never read; parallel to `configuredOAuth`.       | A) Remove variable — could push to it later for reporting. B) Ignore via ESLint.                    | **B**           |
| 264  | `_config`       | Same as 245 for `OAUTH_VARS`.                                                       | Same.                                                                                               | **B**           |

**Reasoning:** Destructuring and names document structure; script may be extended later. Ignore `_`-prefixed vars.

---

### 6.12 `tests/e2e/brute-force.spec.ts` (4 warnings)

| Line | Variable            | Context                                                                                                                             | Options                                                                                                                 | **Recommended**                                                                  |
| ---- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 80   | `_page`, `_context` | Test “should unlock account via email link” — skipped; callback still receives `{ page, context }` from Playwright.                 | A) Omit params — Playwright injects them; test would still run but signature would be incomplete. B) Ignore via ESLint. | **B** — Playwright requires the fixture object; names document what’s available. |
| 225  | `_context`          | Test “should preserve lockout across browser sessions” — uses `page`; `context` from fixture unused (new context created manually). | Same.                                                                                                                   | **B**                                                                            |
| 267  | `_page`             | Test “admin should be able to manually unlock accounts” — skipped; fixture `page` unused.                                           | Same.                                                                                                                   | **B**                                                                            |

**Reasoning:** Playwright test signatures must accept the fixture object. Ignore `_`-prefixed args.

---

### 6.13 `tests/e2e/token-refresh.spec.ts` (3 warnings)

| Line | Variable          | Context                                                                             | Options                                                                                                                                                       | **Recommended**                                                                |
| ---- | ----------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 17   | `_refreshPromise` | `const _refreshPromise = page.waitForRequest(...)` — assertion commented out.       | A) Uncomment assertion and use variable — completes the test. B) Remove assignment and call `page.waitForRequest(...)` for side effect. C) Ignore via ESLint. | **C** — Test is TODO; when implemented, use the variable. For now, ignore `_`. |
| 31   | `_page`           | Test “should redirect to login on refresh failure” — TODO; fixture `page` unused.   | Same as 6.12.                                                                                                                                                 | **B**                                                                          |
| 36   | `_page`           | Test “should update cookie after successful refresh” — TODO; fixture `page` unused. | Same.                                                                                                                                                         | **B**                                                                          |

**Reasoning:** Fixtures and promises are placeholders for future assertions. Ignore `_`-prefixed.

---

### 6.14 `tests/unit/rate-limit.test.ts` (1 warning)

| Line | Variable      | Context                                                                                                        | Options                                                                                                                                                                                                                                              | **Recommended**                                                                      |
| ---- | ------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 205  | `_oldAttempt` | Object describing “attempt outside 15-min window”; test mocks `mockSelectRows([])` so the object isn’t passed. | A) Use in assertion, e.g. `expect(mockSelectRows).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ identifier: _oldAttempt.identifier })]))` if mock exposes it. B) Keep as documentation of “old” attempt; ignore via ESLint. | **B** — Variable documents the scenario; mock abstracts the DB. Ignore `_`-prefixed. |

**Reasoning:** The value documents the test scenario; the test asserts behavior via the mock. Ignore `_`-prefixed vars.

---

## 7. Recommended global fix: ignore `_`-prefixed identifiers

**Conclusion:** All 26 remaining warnings are intentional: required by API/signature, reserved for future use, or documenting intent. No behavior or performance benefit from removing or repurposing these variables.

**Proposed solution:** In ESLint, configure `@typescript-eslint/no-unused-vars` (and `no-unused-vars` if used) so that **variables and arguments whose name starts with `_`** are ignored:

- `argsIgnorePattern: "^_"` — parameters like `_feature`, `_get`, `_input`, `_ownerId`, `_buffer`, `_mimeType`, `_context`, `_permission`, `_page`, `_context`.
- `varsIgnorePattern: "^_"` — variables like `_metaTitle`, `_metaDescription`, `_token`, `_filename`, `_isApi`, `_config`, `_missingOAuth`, `_refreshPromise`, `_oldAttempt`.

**Reasoning:** This matches the common convention that `_` means “intentionally unused.” One config change clears all 26 warnings without touching 15+ files or risking API/behavior changes.

**Implemented:** In `eslint.config.mjs`, added a block that sets `@typescript-eslint/no-unused-vars` to `["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }]` for all `**/*.{ts,tsx,js,jsx,mjs}` files. Only the TypeScript rule is overridden (core `no-unused-vars` is not set, to avoid duplicate warnings). **Result:** 0 errors, 0 warnings.
