# Auth System: UI vs Logic vs DB – Integration Map & Gaps

This document compares the auth system across **UI**, **logic (API/server)**, and **DB**, and lists what is missing to complete end-to-end integration.

---

## 1. Overview

| Layer     | Role                                                          | Key artifacts                                                                                                          |
| --------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **UI**    | Pages and components users see; call APIs or Neon client      | Login, Register, Forgot/Reset password (Neon forms), Verify-email, Sign-out, Callback, Account                         |
| **Logic** | API routes, auth proxy, context, audit, rate limit, user sync | `/api/auth/*`, `/api/v1/*`, `getAuthContext`, `logAuthEvent`, `RateLimiter`, `syncUserFromAuth`                        |
| **DB**    | App-owned tables (Neon Auth owns `neon_auth.*`)               | `neon_user_profiles`, `neon_login_attempts`, `neon_unlock_tokens`, `neon_user_activity_log`, `neon_security_event_log` |

---

## 2. UI ↔ Logic ↔ DB Map

### 2.1 Login

| UI                                                     | Logic                                                                                                                                                                           | DB                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `/login` → `authClient.signIn.email` / `signIn.social` | POST `/api/auth/*` (proxy) → rate limit, captcha, then Neon Auth; on success `resetLoginAttempts`, on fail `recordFailedLoginAttempt` + optional `logAuthEvent(account_locked)` | `neon_login_attempts` read/updated by rate limiter                          |
| —                                                      | `getAuthContext()` → Neon session + `syncUserFromAuth()` + **only on new signup** `logLogin()`                                                                                  | `neon_user_profiles` upserted; `neon_user_activity_log` only for new signup |

**Gap:** Successful login for **existing** users is not written to `neon_user_activity_log` (only signup is). Failed logins are not written as `login_failed` to `neon_security_event_log` (only `account_locked` when locked).

### 2.2 Register

| UI                                                                                 | Logic                                                                                                      | DB                                                                               |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `/register` → `authClient.signUp.email` / `signIn.social`, `sendVerificationEmail` | POST `/api/auth/*`; same proxy; after session, context runs `syncUserFromAuth` + `logLogin` when `created` | `neon_user_profiles` upsert; org/team created; `neon_user_activity_log` (signup) |

**Gap:** None for flow; envelope/contract alignment on verify-email resend is separate (see §3).

### 2.3 Forgot / Reset password

| UI                                                                                 | Logic                                                                                    | DB                                                                                                                                    |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/forgot-password` → Neon `ForgotPasswordForm` (`authClient.requestPasswordReset`) | POST `/api/auth/*` (Neon handler); **custom** POST `/api/forgot-password` not used by UI | No app table for tokens; custom route writes `password_reset_requested` to `neon_security_event_log` only when custom route is called |
| `/reset-password` → Neon `ResetPasswordForm` (`authClient.resetPassword`)          | POST `/api/auth/*` (Neon handler); custom POST `/api/reset-password` not used by UI      | Same; custom route would write `password_reset_completed` to audit if used                                                            |

**Gap:** None for UX; custom routes are optional and only audited when called directly.

### 2.4 Verify email

| UI                                                                         | Logic                                                                                | DB                                                                                    |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `/verify-email` → resend via `apiFetch` to POST `/api/verify-email/resend` | POST `/api/verify-email/*` → Neon internal; `logAuthEvent(email_verified)` on verify | `neon_security_event_log` (email_verified when no userId) or could be user-attributed |

**Gap:** Truth table notes envelope/contract mismatches (UI vs API response shape); not a DB gap.

### 2.5 Sign-out & sessions

| UI                                                                                    | Logic                                                                                                                                           | DB                                                                   |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `/sign-out` → GET `/api/v1/sessions`, POST `/api/auth/logout`, `authClient.signOut()` | GET `/api/v1/sessions` → `listNeonSessions()`; POST `/api/auth/logout` → `logAuthEvent(logout)` only (no DB session delete; Neon owns sessions) | `neon_user_activity_log` (logout)                                    |
| Same page: “Activity Trail” section                                                   | GET `/api/auth/activity` returns `{ events: [], total: 0 }`; **not called by UI**                                                               | `neon_user_activity_log` exists but **not read** by activity API yet |

**Gap:** Activity Trail on sign-out is empty and does not call `/api/auth/activity`. `/api/auth/activity` does not query `neon_user_activity_log`.

### 2.6 Account lockout & unlock

| UI                                                                          | Logic                                                                                                                                             | DB                                                                                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Login shows rate-limit/captcha errors (TOO_MANY_ATTEMPTS, CAPTCHA_REQUIRED) | Proxy checks `checkLoginEligibility`; on lock logs `account_locked`; unlock via POST `/api/auth/unlock` or admin POST `/api/admin/unlock-account` | `neon_login_attempts` (lock state); `neon_unlock_tokens` (unlock links); `neon_security_event_log` (account_locked, account_unlocked) |

**Gap:** If user is fully locked (e.g. must use “unlock” link), the **unlock** flow (e.g. page with token or “request unlock” email) may be missing or not clearly linked from login.

---

## 3. DB Tables – Who Writes / Who Reads

| Table                     | Written by                                                                                     | Read by                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `neon_auth.user`          | Neon Auth                                                                                      | App (reference only; context/sync)                                                   |
| `neon_user_profiles`      | `syncUserFromAuth` (on getAuthContext)                                                         | Queries, org/team services, sharing                                                  |
| `neon_login_attempts`     | `RateLimiter.recordFailedLoginAttempt`, `resetLoginAttempts`                                   | `RateLimiter.checkLoginAttempt` (auth proxy)                                         |
| `neon_unlock_tokens`      | Unlock flow (create token)                                                                     | Unlock route (consume token)                                                         |
| `neon_user_activity_log`  | `logAuthEvent` when `userId` present (login/signup, logout, session, etc.)                     | **Nothing** – GET `/api/auth/activity` returns empty; sign-out page does not call it |
| `neon_security_event_log` | `logAuthEvent` when no `userId` (password_reset_requested, login_failed, account_locked, etc.) | Manual / ops; no in-app UI                                                           |

**Gap:** `neon_user_activity_log` is written but never read by the app. Activity API and sign-out Activity Trail are not wired to it.

---

## 4. What’s Missing to Complete Integration

### 4.1 High impact (complete core auth story)

1. **Wire Activity API to DB and sign-out page**
   - **Logic:** In `GET /api/auth/activity`, query `neon_user_activity_log` for the current user (e.g. by `userId`, ordered by `createdAt`, limit + offset).
   - **UI:** On sign-out page, fetch `GET /api/auth/activity` and show events in the “Activity Trail” table instead of the empty state when `events.length > 0`.
   - **DB:** Already in place.

2. **Log every successful login to activity log**
   - **Logic:** In `getAuthContext()`, after resolving session and `syncUserFromAuth`, call `logLogin(userId, …)` for **every** successful login, not only when `syncResult?.created` (new signup). Optionally keep a separate “signup” event when `created === true`.
   - **DB:** Already in place.

3. **Log every failed login to security event log**
   - **Logic:** In auth proxy POST, when `!response.ok` (failed sign-in), call `logAuthEvent({ action: 'login_failed', success: false, ipAddress, metadata: { email? } })` in addition to `recordFailedLoginAttempt` and optional `account_locked`. Use sanitized metadata (e.g. no raw email in security log if policy says so; identifierHash only is already supported).
   - **DB:** Already in place.

### 4.2 Medium impact (consistency and observability)

4. **Unlock flow discoverability**
   - **UI:** When login returns lockout (TOO_MANY_ATTEMPTS with `retryAfterSeconds` or similar), show a clear “Account locked” message and a link/button to “Request unlock link” or the existing unlock page if it exists.
   - **Logic:** Ensure POST `/api/auth/unlock` (and any “send unlock email” endpoint) is implemented and documented; link from login error state.
   - **DB:** Already in place.

5. **Verify-email envelope alignment**
   - **UI:** Ensure verify-email resend (and any verify call) uses the same `{ data, error }` envelope and contracts as the API (see AUTH-TRUTH-TABLE).
   - **Logic:** APIs already return envelope; UI to parse and display accordingly.

### 4.3 Lower priority (nice to have)

6. **Security event log viewer (admin)**
   - **UI:** Optional admin or ops page to list recent `neon_security_event_log` rows (e.g. `login_failed`, `account_locked`, `password_reset_requested`) with filters.
   - **Logic:** GET endpoint (e.g. `/api/admin/security-events`) with authz and pagination.
   - **DB:** Already in place.

7. **Session list source of truth**
   - **UI:** Sign-out already uses GET `/api/v1/sessions` (Neon). No change needed unless you add a dedicated “Sessions” account page.
   - **Logic:** Already uses `listNeonSessions`; no legacy session table in use for this.

---

## 5. Summary Table

| #   | Gap                                           | Layer      | Action                                                                                                |
| --- | --------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| 1   | Activity Trail empty; API returns []          | Logic + UI | Query `neon_user_activity_log` in GET `/api/auth/activity`; sign-out page fetches and displays events |
| 2   | Only signup logged to user activity log       | Logic      | Call `logLogin()` (or equivalent) in getAuthContext on every successful login                         |
| 3   | Failed logins not logged as login_failed      | Logic      | In auth proxy, on sign-in failure call `logAuthEvent(login_failed, …)` to security_event_log          |
| 4   | Unlock flow not obvious from login            | UI + Logic | Add “Account locked” + “Request unlock” (or link to unlock) when rate limit returns lockout           |
| 5   | Verify-email UI/API envelope mismatch         | UI         | Align verify-email UI with `{ data, error }` and contracts                                            |
| 6   | (Optional) Security events not visible in app | UI + Logic | Optional admin/ops page + GET endpoint for security_event_log                                         |

Implementing **1–3** gives a complete audit trail (success/fail login, activity for current user) and a working Activity Trail on sign-out. **4** and **5** improve UX and consistency; **6** is optional for ops.
