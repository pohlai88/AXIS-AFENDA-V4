# Auth Flow Wireframe & Problem Analysis

**Folder:** `app/(public)/(auth)`  
**Date:** February 3, 2026

---

## 1. Folder structure

```
app/(public)/(auth)/
├── account/
│   └── [path]/
│       └── page.tsx          → /account/settings | /account/security | /account/organizations
├── auth/
│   ├── [path]/
│   │   └── page.tsx          → /auth/sign-in | /auth/sign-up | /auth/sign-out | /auth/forgot-password | /auth/reset-password
│   └── callback/
│       └── page.tsx          → /auth/callback (OAuth/email callback landing)
├── forgot-password/
│   └── page.tsx              → /forgot-password
├── login/
│   └── page.tsx              → /login
├── register/
│   └── page.tsx              → /register
├── reset-password/
│   ├── page.tsx              → /reset-password (server wrapper + Suspense)
│   └── reset-password-client.tsx
└── verify-email/
    └── page.tsx              → /verify-email
```

---

## 2. UI/UX pages summary

| Route                | File(s)                                                 | Purpose                                                                                                                                           |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **/login**           | `login/page.tsx`                                        | Custom sign-in: email/password + OAuth (Google, GitHub), optional hCaptcha, link to register & forgot-password                                    |
| **/register**        | `register/page.tsx`                                     | Custom sign-up: name, email, password, confirm; OAuth; post-signup “verify email” screen with resend                                              |
| **/forgot-password** | `forgot-password/page.tsx`                              | Request reset link: email form → `POST /api/forgot-password`; success message; link back to login                                                 |
| **/reset-password**  | `reset-password/page.tsx` + `reset-password-client.tsx` | New password form; expects `?token=...` from email link; submits to `POST /api/reset-password`                                                    |
| **/verify-email**    | `verify-email/page.tsx`                                 | Resend verification email; email input (prefilled from store/localStorage); link to sign in                                                       |
| **/auth/callback**   | `auth/callback/page.tsx`                                | Callback landing: `getSession()` then redirect to `?next=` or app root; failure copy + “Back to Sign In”                                          |
| **/auth/[path]**     | `auth/[path]/page.tsx`                                  | Redirect-only: sign-in→/login, sign-up→/register, forgot-password→/forgot-password, reset-password→/reset-password, sign-out→sign out then /login |
| **/account/[path]**  | `account/[path]/page.tsx`                               | Shadcn UI: settings, security, organizations (Card, Tabs) + “Back to App” header; links to /app/settings and tenancy                              |

---

## 3. Wireframe: entire auth process

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              PUBLIC (unauthenticated)                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐    │
│   │   /login    │     │  /register  │     │ /forgot-password  │     │ /verify-email    │    │
│   │  (custom)   │     │  (custom)   │     │     (custom)      │     │   (custom)      │    │
│   └──────┬──────┘     └──────┬──────┘     └────────┬─────────┘     └────────┬────────┘    │
│          │                   │                     │                        │             │
│          │ email/pwd          │ signUp.email        │ POST /api/             │ Resend      │
│          │ or OAuth           │ → verify screen     │ forgot-password         │ verify      │
│          │                   │ → sendVerifyEmail   │ redirectTo=             │ POST        │
│          │                   │                     │ /reset-password        │ /api/verify-│
│          │                   │                     │                        │ email/resend│
│          ▼                   ▼                     ▼                        │             │
│   ┌──────────────────────────────────────────────────────────────────────────┐             │
│   │                    callbackURL = /auth/callback?next=...                  │             │
│   └──────────────────────────────────────────────────────────────────────────┘             │
│          │                   │                     │                        │             │
│          └───────────────────┴─────────────────────┴────────────────────────┘             │
│                                          │                                                 │
│                                          ▼                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                         /auth/callback?next=...                                       │  │
│   │                         getSession({ refresh: true }) → redirect(next) or "failed"   │  │
│   └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                          │                                                 │
│                                          ▼                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                    /reset-password?token=... (from email link)                      │  │
│   │                    User opens link from forgot-password email                        │  │
│   │                    Form: new password + confirm → POST /api/reset-password           │  │
│   └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                          │                                                 │
└──────────────────────────────────────────┼─────────────────────────────────────────────────┘
                                           │
                         success (session or password reset)
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATED (redirect to ?next= or /app)                           │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│   /account/settings | /account/security | /account/organizations (shadcn)          │
│   /app (orchestra root)                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Cross-links (navigation between pages)

| From                       | To                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| /login                     | /register (Create account), /forgot-password (Forgot password)                                            |
| /register                  | /login (Already have account); after submit → verify screen → /login, /verify-email (implicit via resend) |
| /forgot-password           | /login (Remember password?)                                                                               |
| /reset-password (no token) | /forgot-password (after 3s)                                                                               |
| /reset-password (success)  | /login (after 2s)                                                                                         |
| /verify-email              | /login (Go to sign in)                                                                                    |
| /auth/callback (failed)    | /login?next=…, / (Home)                                                                                   |

### 3.2 Legacy /auth/* routes (redirect only)

| Legacy route          | Redirects to         |
| --------------------- | -------------------- |
| /auth/sign-in         | /login               |
| /auth/sign-up         | /register            |
| /auth/forgot-password | /forgot-password     |
| /auth/reset-password  | /reset-password      |
| /auth/sign-out        | sign out then /login |

---

## 4. Identified errors / problems

### 4.1 UX / flow

1. **Duplicate auth entry points**  
   ~~Resolved:~~ `/auth/[path]` now redirects to canonical routes only; no duplicate UI.

2. **Verify-email email field can stay empty**  
   `verify-email/page.tsx` uses `defaultValues: { email: initialEmail }` where `initialEmail` comes from `verifyingEmail` (store) or `localStorage.getItem("afenda.lastRegisteredEmail")`. `defaultValues` are only applied on first mount. If the store hydrates after mount or the user opens `/verify-email` in a new tab before the store has the value, the form can show an empty email and the user may not know which address to resend to.  
   **Fix:** Reset form when `initialEmail` becomes available (e.g. `useEffect` + `form.reset({ email: initialEmail })`) or remount with `key={initialEmail}` so the field is prefilled when possible.

3. **Reset-password: no link back to login when token is invalid**  
   When `!token`, the page shows “Invalid reset link” and auto-redirects to `/forgot-password` after 3s. There is no explicit “Sign in” link; users who actually have a valid session might want to go to login instead. Optional improvement: add “Back to Sign In” next to “Redirecting to password recovery…”.

4. **Forgot-password: redirectTo is app-only**  
   `redirectTo` is set to `window.location.origin + routes.ui.auth.resetPassword()` (e.g. `https://origin/reset-password`). Neon Auth typically appends `?token=…` when sending the email. If Neon expects a full URL including a token placeholder, this must match Neon’s docs; otherwise the link in the email should still land on `/reset-password?token=...`. Confirm with Neon that `redirectUrl` is the base page URL and they append the token.

### 4.2 Consistency / code

5. **Reset-password client: mixed form pattern**  
   `reset-password-client.tsx` uses uncontrolled inputs (`useState` + `value`/`onChange`) and manual `ResetPasswordSchema.safeParse`, while login/register/forgot-password/verify-email use `react-hook-form` + `FormField`. Using the same form pattern would improve consistency and reuse of validation/error display.

6. **Reset-password client: setResetToken cleanup**  
   `setResetToken(token)` is called in `useEffect` with cleanup `return () => setResetToken(null)`. If the user navigates away before the effect runs (e.g. rapid navigation), the cleanup can clear a token that was set in a previous mount. Low risk but worth being aware of for edge cases.

7. **Verify-email: form not reset after initialEmail update**  
   Same as (2): if `initialEmail` is empty on first render and later populated (e.g. from localStorage or store), the email input does not update. Tied to the fix for (2).

### 4.3 Accessibility / robustness

8. **Reset-password: duplicate error UI when token missing**  
   When `error && !token`, the page shows both the Alert and “Redirecting to password recovery…”. The `error` state is set in the same `useEffect` that triggers redirect; behavior is correct but the message could be one clear line (e.g. “Invalid or missing reset link. Redirecting to request a new link…”).

9. **Login/register: session check vs. form**  
   When `isSessionLoading` is true, the pages show “Checking session…” and still render the form below. Users could try to submit before session check completes. Consider disabling the form (or hiding it) while `isSessionLoading` is true to avoid duplicate submit or confusion.

10. **Auth callback: no explicit error code**  
    On failure, the page shows generic copy (cookies, Neon compute, OAuth redirect). There is no `error` or `code` query param from the backend to show a more specific message (e.g. “verification_expired”). If Neon or your backend can return such a param, the callback page could display it.

---

## 5. Wireframe vs implementation checklist

| Step                | Wireframe expectation                         | Implementation                                                    | Status        |
| ------------------- | --------------------------------------------- | ----------------------------------------------------------------- | ------------- |
| Sign-in             | Single entry (custom or Neon)                 | /login only; /auth/sign-in redirects                              | ✅             |
| Sign-up             | Single entry                                  | /register only; /auth/sign-up redirects                           | ✅             |
| Post sign-up        | Verify email screen → link to inbox / sign in | Implemented                                                       | ✅             |
| Forgot password     | Email → link in email → reset form            | Custom /forgot-password + /reset-password?token=                  | ✅             |
| Reset password      | Token in URL, new password form               | token from `searchParams`, POST /api/reset-password               | ✅             |
| Callback            | Land on /auth/callback, then redirect         | getSession + replace(next) or failed UI                           | ✅             |
| Verify email resend | Prefilled email, resend                       | initialEmail from store/localStorage; can be empty on first paint | ⚠️ Bug (2)/(7) |

---

## 6. Recommended next steps

1. **Decide single auth surface**  
   ~~Done:~~ Single canonical flow; `/auth/[path]` redirects to `/login`, `/register`, etc.

2. **Fix verify-email prefill**  
   Ensure the email field updates when `initialEmail` becomes available (form reset or key-based remount).

3. **Align reset-password with shared form pattern**  
   Optionally refactor `reset-password-client.tsx` to use `react-hook-form` + `FormField` and shared error display like the other auth pages.

4. **Optional UX tweaks**  
   Add “Back to Sign In” on reset-password invalid-token view; disable or hide login/register form while `isSessionLoading`; consider passing an error code to /auth/callback for clearer failure messages.
