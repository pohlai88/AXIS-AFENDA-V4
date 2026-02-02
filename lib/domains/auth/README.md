## Auth domain (`auth`)

### Purpose

Authentication and session edges:
- Neon Auth integration (server + client)
- Public auth pages: login/register/forgot/reset/verify
- Rate-limiting + lockout + audit logging

### Lineage (where to look first)

- **URLs**: `lib/routes.ts` (`routes.ui.auth.*`, `routes.api.publicAuth.*`, `routes.api.auth.*`, `routes.api.v1.auth.*`)
- **Neon Auth plumbing**:
  - `lib/auth/client.ts` (client SDK)
  - `lib/auth/server.ts` (server SDK)
  - `app/api/auth/(auth)/[...path]/route.ts` (catch-all handler)
- **Auth context**: `lib/server/auth/context.ts`

### Feature checklist (UI + API + DB + components)

| Feature                    | UI (page)                                               | API (feature-first)                                                                 | API (provider/catch-all) | DB                                                  | Key components                   | Status |
| -------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------- | -------------------------------- | ------ |
| Login                      | `app/(public)/(auth)/login/page.tsx`                    | (uses Neon SDK)                                                                     | `/api/auth/*`            | `public.login_attempts`, `public.user_activity_log` | `components/auth/*`              | ✅      |
| Register                   | `app/(public)/(auth)/register/page.tsx`                 | (uses Neon SDK)                                                                     | `/api/auth/*`            | `public.users` (currently), `neon_auth.*`           | `components/auth/*`              | ✅      |
| Forgot password            | `app/(public)/(auth)/forgot-password/page.tsx`          | `/api/forgot-password` → `app/api/(public)/(auth)/forgot-password/route.ts`         | `/api/auth/*`            | `neon_auth.*`                                       | `components/auth/auth-shell.tsx` | ✅      |
| Reset password             | `app/(public)/(auth)/reset-password/*`                  | `/api/reset-password` → `app/api/(public)/(auth)/reset-password/route.ts`           | `/api/auth/*`            | `neon_auth.*`                                       | `components/auth/auth-shell.tsx` | ✅      |
| Verify email (verify code) | `app/(public)/(auth)/verify-email/page.tsx` (resend UI) | `/api/verify-email` → `app/api/(public)/(auth)/verify-email/route.ts`               | `/api/auth/*`            | `neon_auth.*`                                       | `components/auth/auth-shell.tsx` | ✅      |
| Verify email (send)        | (triggered from register / verify page)                 | `/api/verify-email/send` → `app/api/(public)/(auth)/verify-email/send/route.ts`     | `/api/auth/*`            | `neon_auth.*`                                       | `components/auth/auth-shell.tsx` | ✅      |
| Verify email (resend)      | `app/(public)/(auth)/verify-email/page.tsx`             | `/api/verify-email/resend` → `app/api/(public)/(auth)/verify-email/resend/route.ts` | `/api/auth/*`            | `neon_auth.*`                                       | `components/auth/auth-shell.tsx` | ✅      |
| Session finalize callback  | `app/(public)/(auth)/auth/callback/page.tsx`            | `/api/auth/get-session`                                                             | `/api/auth/*`            | `neon_auth.*`                                       | `components/auth/auth-shell.tsx` | ✅      |

### Notes / “known edges”

- **Feature-first auth APIs** live under `app/api/(public)/(auth)/...` and are intended to mirror the public auth UI route names for debuggability.
- **Neon Auth catch-all** remains under `app/api/auth/(auth)/[...path]/route.ts` and is the foundation for the SDK.

