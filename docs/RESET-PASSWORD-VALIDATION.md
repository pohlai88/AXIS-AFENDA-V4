# Reset Password Integration – Validation & Configuration

## Summary

**Password reset is fully delegated to Neon Auth.** There is **no app-owned DB table** for reset tokens. Neon Auth stores tokens and user credentials in the `neon_auth` schema (managed by Neon). Our app only:

- Exposes **forgot-password** and **reset-password** APIs that forward to Neon Auth.
- Logs **password_reset_requested** and **password_reset_completed** to our **security_event_log** and **user_activity_log** (audit only).

So “not configured in the db” means: **Neon Auth (and its DB) must be configured**; our app DB does not hold reset tokens.

---

## 1. Flow (no app DB for tokens)

| Step                                           | Where                                                                                 | DB / config                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| User submits email on `/forgot-password`       | `POST /api/forgot-password` → `auth.handler().POST(/api/auth/password/reset)`         | **Neon Auth** sends email and stores reset token in **neon_auth** (Neon-managed).             |
| User clicks link in email                      | Link is `{origin}/reset-password?token=...`                                           | Token is in Neon Auth; our app never stores it.                                               |
| User submits new password on `/reset-password` | `POST /api/reset-password` → `auth.handler().POST(/api/auth/password/reset-password)` | **Neon Auth** validates token and updates password in **neon_auth**.                          |
| Audit                                          | `logAuthEvent({ action: 'password_reset_requested' })` / `password_reset_completed`   | Our tables: **neon_security_event_log** (no userId) / **neon_user_activity_log** (if userId). |

- **Reset token storage:** Neon Auth only (neon_auth schema, not our Drizzle schema).
- **App DB:** Used only for audit (security_event_log, user_activity_log). No `password_reset_tokens` (or similar) table in app.

---

## 2. What must be configured (Neon Auth / Neon Console)

These are required for reset password to work; none of them are “tables in our DB”.

1. **Neon Console → Project → Branch → Auth**
   - **Auth** must be **enabled** for the branch.
   - **Sign-up with Email** must be **enabled**.  
     Neon docs: *“Password reset is automatically available when email authentication is enabled.”*

2. **Environment variables** (already used by the app)
   - `NEON_AUTH_BASE_URL` – Neon Auth base URL (e.g. `https://ep-xxx.neonauth.region.aws.neon.tech/neondb/auth`).
   - `NEON_AUTH_COOKIE_SECRET` – Cookie secret (min 32 chars).

3. **Email delivery (for reset links)**
   - Neon Auth must be able to send email (reset link). If Neon uses an external provider (e.g. Resend/SendGrid), that must be configured in **Neon Console → Auth** (or wherever Neon configures email). Without this, “request reset” may succeed but the user never receives the link.

4. **Redirect URL**
   - Forgot-password API sends `redirectUrl: origin + /reset-password` (no token in URL). Neon Auth is expected to send a link that lands on `{redirectUrl}?token=...`. Confirm in Neon docs/dashboard that the reset link format matches our `/reset-password?token=...` page.

---

## 3. App-side checks (no DB migrations for reset tokens)

- **Routes:**  
  - `POST /api/forgot-password` → forwards to Neon Auth `password/reset`.  
  - `GET /api/reset-password?token=...` → forwards to `password/verify-reset-token`.  
  - `POST /api/reset-password` (body: `token`, `password`) → forwards to `password/reset-password`.
- **Audit:**  
  - `password_reset_requested` and `password_reset_completed` are written to **neon_security_event_log** / **neon_user_activity_log** (existing tables). No new tables needed.
- **Drizzle schema:**  
  - No `password_reset_tokens` (or similar) table. Do **not** add one for Neon Auth reset flow; Neon Auth owns token storage.

---

## 4. Verify in DB that the reset was triggered

When the **custom** `POST /api/forgot-password` route is used (e.g. server-side or legacy clients), the app writes to the DB. The current UI uses Neon's **ForgotPasswordForm**, which calls `authClient.requestPasswordReset` and goes through `/api/auth/*`, so no row is written by our custom route unless something calls `/api/forgot-password` directly.

**Table:** `neon_security_event_log` · **Action:** `password_reset_requested`

```sql
SELECT id, action, success, identifier_type, ip_address, metadata, created_at
FROM neon_security_event_log
WHERE action = 'password_reset_requested'
ORDER BY created_at DESC
LIMIT 20;
```

- **Row with `success = true`** → Neon accepted the request; if email doesn't arrive, check Neon Console → Auth → email provider and spam folder.
- **Row with `success = false`** → Check server logs for "Neon Auth password reset returned non-OK" and `metadata->>'neonStatus'`.
- **No row** → Request didn't hit `/api/forgot-password` (e.g. UI uses Neon form) or `logAuthEvent` threw.

We do not store the user's email (only `identifier_hash`). Match by `created_at` and `ip_address` for a given attempt.

---

## 5. If reset doesn’t work – what to check

| Symptom                                   | Check                                                                                                                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| “Reset link never arrives”                | Neon Auth email config (Neon Console → Auth); ensure “Sign-up with Email” (and thus password reset) is enabled and email provider is set.                                        |
| “Invalid or expired reset token”          | Token may be expired (e.g. 15 min). User must request a new link. Confirm Neon Auth token TTL if configurable.                                                                   |
| “Reset fails” (e.g. 400/500 from our API) | Inspect response from Neon Auth in `app/api/(public)/(auth)/reset-password/route.ts`. Confirm `NEON_AUTH_BASE_URL` and that Neon Auth is enabled for the branch.                 |
| “Not configured in the db”                | No app DB table is required for reset tokens. Ensure **Neon Auth is enabled** and **Sign-up with Email** is enabled in Neon Console; Neon creates and uses the neon_auth schema. |

---

## 6. References

- [Neon Auth – Password reset](https://neon.com/docs/auth/guides/password-reset) – recommends ForgotPasswordForm/ResetPasswordForm (we use these on `/forgot-password` and `/reset-password`).
- [NEON-AUTH-OAUTH-SETUP.md](./NEON-AUTH-OAUTH-SETUP.md) – env vars and Neon Console (Auth, OAuth).
- App: `app/api/(public)/(auth)/forgot-password/route.ts`, `app/api/(public)/(auth)/reset-password/route.ts`, `lib/server/auth/audit-log.ts`.
