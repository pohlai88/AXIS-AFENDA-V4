# Auth Truth Table (UI ↔ API ↔ Neon Auth)

**Date**: 2026-02-02  
**Source of truth**: Neon Auth (no local users/sessions/accounts/password-reset/verification tables)

This document maps each auth feature to its **UI route**, **API endpoints**, **Neon Auth method**, **contracts**, and whether it is compliant with the repo’s mandatory `{ data, error }` envelope.

## UI Routes (public auth domain)

| Feature | URL | File | Primary Neon Method | Contracts | Envelope compliant? | Notes / gaps |
|---|---|---|---|---|---|---|
| Login (email + OAuth) | `/login` | `app/(public)/(auth)/login/page.tsx` | `authClient.signIn.email`, `authClient.signIn.social` | `lib/contracts/auth/login.ts` | Partial | Uses enterprise RHF+Zod + shared components, but submit button is still a custom `<button>` (should be shadcn `Button`). |
| Register (email + OAuth) | `/register` | `app/(public)/(auth)/register/page.tsx` | `authClient.signUp.email`, `authClient.signIn.social`, `authClient.sendVerificationEmail` | `lib/contracts/auth/register.ts` | Partial | Uses RHF+Zod; still has custom `<button>` submit + `console.error` in resend verification path. |
| Forgot password | `/forgot-password` | `app/(public)/(auth)/forgot-password/page.tsx` | Feature API → Neon Auth internal password reset | Should use `lib/contracts/auth/password-reset.ts` (`ForgotPasswordSchema`) | ❌ | UI parses `{ error?: string }` but API returns `{ data, error }`. Uses local state + raw `fetch()`. |
| Reset password | `/reset-password` | `app/(public)/(auth)/reset-password/page.tsx` + `reset-password/reset-password-client.tsx` | Feature API → Neon Auth internal reset-password | Should use `lib/contracts/auth/password-reset.ts` (`ResetPasswordSchema`) | ❌ | Client parses `{ error?: string }` but API returns `{ data, error }`. Uses raw `fetch()` + toast. |
| Verify email (resend) | `/verify-email` | `app/(public)/(auth)/verify-email/page.tsx` | Feature API → Neon Auth internal email resend | Should use `lib/contracts/auth/password-reset.ts` (`ResendVerificationSchema`) | ❌ | UI parses `{ error?: string }` but API returns `{ data, error }`. Also does not use OTP UI; it’s “resend email” UX. |
| Neon Auth built-in pages | `/auth/*` | `app/(public)/(auth)/auth/[path]/page.tsx` | `@neondatabase/auth/react` `AuthView` | N/A | N/A | Uses Neon Auth built-in CSS/UI (no custom wrappers). |
| Neon Account built-in pages | `/account/*` | `app/(public)/(auth)/account/[path]/page.tsx` | `@neondatabase/auth/react` `AccountView` | N/A | N/A | Has a custom “Back to App” header; currently hardcodes `/app` instead of `routes.ui.orchestra.root()`. |

## Public feature APIs (feature-first auth APIs)

All of these **already** use the standardized envelope via `lib/server/api/response.ts`.

| Feature API | URL | File | Delegates to | Envelope compliant? | Notes / gaps |
|---|---|---|---|---|---|
| Forgot password | `POST /api/forgot-password` | `app/api/(public)/(auth)/forgot-password/route.ts` | `auth.handler().POST` → `routes.api.auth.internal.password.reset()` | ✅ | Correctly avoids email enumeration by always returning success. Input validation is currently manual and should use `ForgotPasswordSchema`. |
| Reset password | `GET /api/reset-password?token=...` | `app/api/(public)/(auth)/reset-password/route.ts` | `auth.handler().POST` → `routes.api.auth.internal.password.verifyResetToken()` | ✅ | Good envelope. Should validate token with Zod and ensure consistent `ApiError.code` usage. |
| Reset password | `POST /api/reset-password` | `app/api/(public)/(auth)/reset-password/route.ts` | `auth.handler().POST` → `routes.api.auth.internal.password.resetPassword()` | ✅ | Good envelope. Input validation is manual and should use `ResetPasswordSchema`. |
| Verify email (verify code) | `GET/POST /api/verify-email` | `app/api/(public)/(auth)/verify-email/route.ts` | `auth.handler().POST` → `routes.api.auth.internal.email.verify()` | ✅ | Good envelope; currently verifies `code` only. |
| Verify email (send) | `POST /api/verify-email/send` | `app/api/(public)/(auth)/verify-email/send/route.ts` | `auth.handler().POST` → `routes.api.auth.internal.email.sendCode()` | ✅ | Returns OK even on errors (anti-enumeration). Should validate input with Zod. |
| Verify email (resend) | `POST /api/verify-email/resend` | `app/api/(public)/(auth)/verify-email/resend/route.ts` | `auth.handler().POST` → `routes.api.auth.internal.email.resendCode()` | ✅ | Returns OK even on errors (anti-enumeration). Should validate input with Zod. |

## Provider/catch-all auth proxy APIs (`/api/auth/*`)

| Endpoint | URL | File | Envelope compliant? | Notes / gaps |
|---|---|---|---|---|
| Neon Auth proxy (catch-all) | `GET/POST /api/auth/*` | `app/api/auth/(auth)/[...path]/route.ts` | ❌ (for rate-limit/captcha branches) | For sign-in, rate-limit/captcha errors return `{ error, requiresCaptcha }` not `{ data, error }`. Must use `fail()` envelope for consistency with `apiFetch`. |
| Session list & revocation (unversioned) | `GET/POST /api/auth/sessions` | `app/api/auth/(auth)/sessions/route.ts` | ✅ | Uses envelope but is currently backed by legacy DB sessions table (`lib/server/auth/session-helpers.ts`). |
| Token refresh | `POST /api/auth/refresh` | `app/api/auth/(auth)/refresh/route.ts` | ✅ | Envelope OK. Audit logging currently drops events without `userId`. |
| Logout | `POST /api/auth/logout` | `app/api/auth/(auth)/logout/route.ts` | ✅ | Uses envelope but deletes from legacy DB `sessions` table and clears cookies manually. Must align with Neon-only (Neon sign-out/session revocation). |
| Unlock account | `GET/POST /api/auth/unlock` | `app/api/auth/(auth)/unlock/route.ts` | ✅ | Uses envelope; uses `verificationTokens` table for unlock tokens (currently defined in DB schema). Decide whether to keep as security utility or migrate to separate security event storage. |

## Versioned v1 auth APIs (`/api/v1/*`)

| Endpoint | URL | File | Contracts | Envelope compliant? | Notes / gaps |
|---|---|---|---|---|---|
| Me (auth + tenant) | `GET /api/v1/me` | `app/api/v1/(auth)/me/route.ts` | N/A | ✅ | Returns `auth` from `lib/server/auth/context.ts` and tenant from `lib/server/tenant/context.ts`. |
| Sessions list/revoke | `GET/DELETE /api/v1/sessions` | `app/api/v1/(auth)/sessions/route.ts` | `lib/contracts/sessions.ts` | ✅ | Currently uses legacy DB sessions table (cookie-derived current session token). Must migrate to Neon session APIs. |
| Session revoke by id | `DELETE /api/v1/sessions/:id` | `app/api/v1/(auth)/sessions/[id]/route.ts` | `lib/contracts/sessions.ts` | ✅ | Currently uses legacy DB sessions table. Must migrate. |
| User by id | `GET /api/v1/users/:id` | `app/api/v1/(auth)/users/[id]/route.ts` | `lib/contracts/sessions.ts` (`userIdParamSchema`) | ✅ | Currently queries local `users` table via `lib/server/db/queries-edge/user.queries.ts` (legacy). Must be redefined for Neon-only (likely “self only unless admin”). |

## Primary “legacy drift” hotspots to eliminate
- `lib/server/db/schema/index.ts`: currently defines legacy auth tables (`users`, `sessions`, etc.) which conflicts with Neon-only direction.\n+- `lib/server/auth/session-helpers.ts`, `app/api/auth/(auth)/sessions/route.ts`, `app/api/v1/(auth)/sessions/*`: depend on legacy `sessions` table.\n+- `app/api/auth/(auth)/logout/route.ts`: deletes from legacy `sessions` table.\n+- `app/api/v1/(auth)/users/[id]/route.ts` and `lib/server/db/queries*/user.queries.ts`: depend on legacy `users` table.\n+\n+## Next implementation order (matches plan)\n+1. Align all auth UIs + auth proxy errors to the `{ data, error }` envelope.\n+2. Migrate sessions and users endpoints to Neon-only.\n+3. Introduce enterprise-grade security event logging for unauthenticated events (lockouts/captcha), without breaking `user_activity_log`.\n+\n*** End Patch to=functions.ApplyPatch
