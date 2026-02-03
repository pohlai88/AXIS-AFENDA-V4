# Auth Pages: Theme Toggler (Sun/Moon) – Best Practice

## Recommended placement: **top-right of the viewport**

Put the Sun/Moon theme switcher in the **top-right corner** on every auth page so that:

1. **Consistent** – Same position on login, register, forgot-password, reset-password, verify-email, sign-out, and callback.
2. **Visible** – No scrolling; users see it as soon as they land on any auth screen.
3. **Non-competing** – Doesn’t sit next to primary actions (Sign in, Sign up, Submit). Primary actions stay centered; theme is a secondary control.
4. **Familiar** – Matches common patterns (e.g. Gmail, GitHub, many SaaS apps put theme/settings in the top-right).
5. **Accessible** – Easy to reach (e.g. `position: absolute` or in a fixed header), with `aria-label="Toggle theme"` and keyboard support.

## Where it’s implemented

| Surface                                                                                               | Location                                                                                          |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **AuthShell** (login, register, forgot-password, reset-password, verify-email, callback, auth/[path]) | Top-right of the shell (`absolute top-4 right-4` or equivalent), above/beside the brand wordmark. |
| **Sign-out page** (custom layout, no AuthShell)                                                       | Top-right of the page (e.g. in the sticky bar, right side, or same `absolute top-4 right-4`).     |

## What to use

- **AnimatedThemeToggler** (`@/components/ui/animated-theme-toggler`) – Sun/Moon toggle with optional View Transitions API; same component used in the app layout header.
- Avoid placing the toggler inside the card (next to the form title) so the card stays focused on the main action.
- Avoid bottom-only placement (e.g. only below the slogan); top-right is more discoverable.

## Summary

**Best practice:** One theme toggler, **top-right on every auth view** (AuthShell + sign-out), using the same component for consistency.
