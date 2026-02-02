# Neon Auth Integration Implementation Guide

**Date**: February 2, 2026  
**Version**: 1.0  
**Status**: Implementation Plan

---

## 1. Architecture Overview

### Styling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      Root Layout                             │
│                   (app/layout.tsx)                           │
│                   Loads: globals.css                         │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐       ┌────────▼────────┐
│  Auth Pages    │       │  App Pages      │
│  /auth/*       │       │  /app/*         │
│  /account/*    │       │  (app)/*        │
│                │       │                 │
│  Uses:         │       │  Uses:          │
│  - Neon Auth   │       │  - App Shell    │
│    CSS         │       │  - globals.css  │
│  - Built-in    │       │  - Tailwind     │
│    components  │       │  - Custom       │
│                │       │    components   │
└────────────────┘       └─────────────────┘
```

---

## 2. File Organization

### Auth-Related Files (Use Neon Auth CSS)

#### `/auth/*` - Authentication Pages
- **Location**: `app/auth/[path]/page.tsx`
- **Routes**: 
  - `/auth/sign-in` - Sign in page
  - `/auth/sign-up` - Sign up page
  - `/auth/forgot-password` - Password reset
  - `/auth/reset-password` - Reset password confirmation
- **Styling**: 
  - ✅ Neon Auth built-in CSS (loaded via AuthView component)
  - ✅ No custom wrapper layouts
  - ✅ CSP-compliant inline styles
- **Component**: `<AuthView path={path} />`
- **Layout**: None (uses root layout only)
- **Implementation**:
  ```tsx
  'use client';
  import dynamic from 'next/dynamic';
  
  const AuthView = dynamic(
    () => import('@neondatabase/neon-auth-react').then(mod => mod.AuthView),
    { ssr: false }
  );
  
  export default function AuthPage({ params }: { params: { path: string } }) {
    return <AuthView path={params.path} />;
  }
  ```

#### `/account/*` - Account Management Pages
- **Location**: `app/account/[path]/page.tsx`
- **Routes**:
  - `/account/settings` - User settings
  - `/account/security` - Security & password
- **Styling**:
  - ✅ Neon Auth built-in CSS (loaded via AccountView component)
  - ✅ Custom "Back to App" button using globals.css
  - ⚠️ **CRITICAL**: Remove `app/account/layout.tsx` (creates wrapper conflict)
- **Component**: `<AccountView path={path} />`
- **Layout**: None (uses root layout only)
- **Implementation**:
  ```tsx
  'use client';
  import dynamic from 'next/dynamic';
  import Link from 'next/link';
  
  const AccountView = dynamic(
    () => import('@neondatabase/neon-auth-react').then(mod => mod.AccountView),
    { ssr: false }
  );
  
  export default function AccountPage({ params }: { params: { path: string } }) {
    return (
      <div className="min-h-screen">
        {/* Navigation Header */}
        <div className="border-b bg-background">
          <div className="container flex h-14 items-center px-4">
            <Link 
              href="/app" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              ← Back to App
            </Link>
          </div>
        </div>
        
        {/* Neon Auth Component */}
        <AccountView path={params.path} />
      </div>
    );
  }
  ```

---

### App-Related Files (Use App Shell + globals.css)

#### `/app/*` - Main Application Pages
- **Location**: `app/(app)/**/*.tsx`
- **Routes**: All pages under `/app/*` route group
- **Styling**:
  - ✅ globals.css (Tailwind utilities)
  - ✅ App shell components (sidebar, header, breadcrumbs)
  - ✅ Custom shadcn/ui components
- **Layout**: `app/(app)/layout.tsx` (AppShell wrapper)
- **Components Used**:
  - `<AppSidebar />` - Navigation sidebar
  - `<SiteHeader />` - Top header with breadcrumbs
  - `<NavUser />` - User menu dropdown
  - Custom page components

#### Public Pages
- **Location**: `app/(public)/**/*.tsx`
- **Routes**: Landing, marketing, public docs
- **Styling**:
  - ✅ globals.css
  - ✅ Custom marketing components
  - ✅ No app shell
- **Layout**: `app/(public)/layout.tsx` (minimal wrapper)

---

## 3. Critical Fixes Required

### 🚨 Issue #1: Account Layout Conflict

**Problem**: `app/account/layout.tsx` wraps AccountView in conflicting container

**Current Code** (app/account/layout.tsx):
```tsx
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link href="/app">← Back to App</Link>
      </div>
      {children}
    </div>
  );
}
```

**Impact**: 
- Creates double wrapper around Neon Auth AccountView
- "Back to App" button appears outside AccountView component
- Breaks Neon Auth's built-in layout system

**Solution**:
```bash
# DELETE this file
rm app/account/layout.tsx
```

**Rationale**: Neon Auth AccountView has built-in layout, navigation should be integrated into page component, not wrapper layout.

---

### 🚨 Issue #2: Account Page Integration

**Current Code** (app/account/[path]/page.tsx):
```tsx
const AccountView = dynamic(
  () => import('@neondatabase/neon-auth-react').then(mod => mod.AccountView),
  { ssr: false }
);

export default function AccountPage({ params }: { params: { path: string } }) {
  return <AccountView path={params.path} />;
}
```

**Updated Code**:
```tsx
'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const AccountView = dynamic(
  () => import('@neondatabase/neon-auth-react').then(mod => mod.AccountView),
  { ssr: false }
);

export default function AccountPage({ params }: { params: { path: string } }) {
  return (
    <div className="min-h-screen">
      {/* Custom Navigation Header - Uses globals.css */}
      <div className="border-b bg-background">
        <div className="container flex h-14 items-center px-4">
          <Link 
            href="/app" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to App
          </Link>
        </div>
      </div>
      
      {/* Neon Auth Component - Uses Neon Auth CSS */}
      <AccountView path={params.path} />
    </div>
  );
}
```

**Key Changes**:
- ✅ Add custom header with "Back to App" link
- ✅ Header uses Tailwind classes from globals.css
- ✅ AccountView rendered without wrapper interference
- ✅ Clean separation: custom nav (globals.css) + auth component (Neon Auth CSS)

---

## 4. Implementation Steps

### Step 1: Fix Account Layout Conflict
```bash
# 1. Delete conflicting layout
rm app/account/layout.tsx

# 2. Verify file is removed
ls app/account/
```

**Expected Result**: Only `[path]/` directory remains in `app/account/`

---

### Step 2: Update Account Page Component
**File**: `app/account/[path]/page.tsx`

**Action**: Replace entire file content with:
```tsx
'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const AccountView = dynamic(
  () => import('@neondatabase/neon-auth-react').then(mod => mod.AccountView),
  { ssr: false }
);

export default function AccountPage({ params }: { params: { path: string } }) {
  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <div className="border-b bg-background">
        <div className="container flex h-14 items-center px-4">
          <Link 
            href="/app" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to App
          </Link>
        </div>
      </div>
      
      {/* Neon Auth Component */}
      <AccountView path={params.path} />
    </div>
  );
}
```

---

### Step 3: Verify Auth Pages (No Changes Needed)
**Files**: 
- `app/auth/[path]/page.tsx`
- `app/_components/auth-provider.tsx`

**Status**: ✅ Already correct - using Neon Auth CSS properly

**Verification**:
```bash
# Test auth pages render correctly
# Visit: http://localhost:3000/auth/sign-in
# Expected: Neon Auth UI with built-in styles, no layout wrapper
```

---

### Step 4: Verify App Shell Pages (No Changes Needed)
**Files**: `app/(app)/**/*.tsx`

**Status**: ✅ Already correct - using app shell + globals.css

**Verification**:
```bash
# Test app pages render correctly
# Visit: http://localhost:3000/app
# Expected: App shell with sidebar, header, breadcrumbs
```

---

## 5. CSS Loading Strategy

### Root Layout (app/layout.tsx)
```tsx
import './globals.css'; // ✅ Loaded once at root

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <NeonAuthUIProvider> {/* Loads Neon Auth CSS internally */}
            {children}
          </NeonAuthUIProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**CSS Priority**:
1. `globals.css` - Base Tailwind + custom styles (loaded by root layout)
2. Neon Auth CSS - Loaded by `@neondatabase/neon-auth-react` components
3. Component-specific CSS - Loaded by individual components as needed

**Cascade Order**:
```
Root Layout
  └─ globals.css (Tailwind base, components, utilities)
      └─ NeonAuthUIProvider
          └─ Neon Auth CSS (only when AuthView/AccountView rendered)
              └─ Component CSS (shadcn/ui, custom)
```

---

## 6. Page-by-Page Styling Map

### Auth Pages (Neon Auth CSS)
| Route | File | CSS Source | Layout |
|-------|------|------------|--------|
| `/auth/sign-in` | `app/auth/[path]/page.tsx` | Neon Auth | Root only |
| `/auth/sign-up` | `app/auth/[path]/page.tsx` | Neon Auth | Root only |
| `/auth/forgot-password` | `app/auth/[path]/page.tsx` | Neon Auth | Root only |
| `/auth/reset-password` | `app/auth/[path]/page.tsx` | Neon Auth | Root only |
| `/account/settings` | `app/account/[path]/page.tsx` | Neon Auth + globals.css | Root only |
| `/account/security` | `app/account/[path]/page.tsx` | Neon Auth + globals.css | Root only |

### App Pages (App Shell + globals.css)
| Route | File | CSS Source | Layout |
|-------|------|------------|--------|
| `/app` | `app/(app)/page.tsx` | globals.css | App Shell |
| `/app/tenancy/organizations` | `app/(app)/tenancy/organizations/page.tsx` | globals.css | App Shell |
| `/app/tenancy/organizations/[id]` | `app/(app)/tenancy/organizations/[id]/page.tsx` | globals.css | App Shell |
| `/app/tenancy/teams` | `app/(app)/tenancy/teams/page.tsx` | globals.css | App Shell |
| `/app/tenancy/teams/[id]` | `app/(app)/tenancy/teams/[id]/page.tsx` | globals.css | App Shell |
| `/app/management/*` | `app/(app)/management/**/page.tsx` | globals.css | App Shell |

### Public Pages (globals.css)
| Route | File | CSS Source | Layout |
|-------|------|------------|--------|
| `/` | `app/(public)/page.tsx` | globals.css | Public |
| `/about` | `app/(public)/about/page.tsx` | globals.css | Public |
| `/pricing` | `app/(public)/pricing/page.tsx` | globals.css | Public |

---

## 7. Testing Checklist

### ✅ Auth Pages Testing
- [ ] Visit `/auth/sign-in` - Neon Auth UI renders with built-in styles
- [ ] Visit `/auth/sign-up` - Sign up form renders correctly
- [ ] No CSP violations in console (verify inline styles work)
- [ ] No hydration errors (verify ssr: false working)
- [ ] OAuth buttons visible (Google, GitHub)

### ✅ Account Pages Testing
- [ ] Visit `/account/settings` - Settings page renders
- [ ] "Back to App" button visible at top
- [ ] "Back to App" link works (redirects to `/app`)
- [ ] No double wrapper (verify layout.tsx deleted)
- [ ] AccountView component renders below header
- [ ] Tailwind styles work in custom header
- [ ] Neon Auth styles work in AccountView

### ✅ App Pages Testing
- [ ] Visit `/app` - Dashboard with app shell renders
- [ ] Sidebar visible with navigation
- [ ] Header with breadcrumbs visible
- [ ] User menu dropdown works
- [ ] User menu "Account Settings" link goes to `/account/settings`
- [ ] User menu "Security" link goes to `/account/security`
- [ ] Sign out works and redirects to `/auth/sign-in`

### ✅ Navigation Flow Testing
- [ ] Login → Redirects to `/app` (dashboard)
- [ ] `/app` → User menu → Account Settings → `/account/settings`
- [ ] `/account/settings` → Back to App → `/app`
- [ ] `/account/security` → Back to App → `/app`
- [ ] `/app` → User menu → Sign out → `/auth/sign-in`

---

## 8. Known Issues & Resolutions

### Issue: CSP Inline Style Violations
**Status**: ✅ Resolved  
**Solution**: Removed nonce from `style-src` directive in `proxy.ts`  
**Code**:
```typescript
// proxy.ts line 16
const csp = `
  script-src 'self' 'nonce-${nonce}';
  style-src 'self' 'unsafe-inline';  // ✅ No nonce here
`;
```

### Issue: JWT Debug Log Spam
**Status**: ✅ Resolved  
**Solution**: Removed debug log from `lib/server/auth/jwt.ts`  
**Rationale**: Non-JWT tokens (opaque session cookies) are expected

### Issue: React Hydration Mismatches
**Status**: ✅ Resolved  
**Solution**: Used dynamic imports with `ssr: false` for Neon Auth components  
**Code**:
```tsx
const AuthView = dynamic(
  () => import('@neondatabase/neon-auth-react').then(mod => mod.AuthView),
  { ssr: false }
);
```

### Issue: Account Layout Wrapper Conflict
**Status**: 🚨 **PENDING FIX**  
**Solution**: Delete `app/account/layout.tsx` and integrate header into page component  
**Priority**: **CRITICAL** - Blocks proper account page rendering

---

## 9. File Modifications Summary

### Files to DELETE
```bash
app/account/layout.tsx  # ❌ DELETE - Creates wrapper conflict
```

### Files to UPDATE
```bash
app/account/[path]/page.tsx  # ✏️ UPDATE - Add custom header with "Back to App"
```

### Files Already Correct (No Changes)
```bash
app/auth/[path]/page.tsx           # ✅ Correct - Dynamic import with ssr: false
app/_components/auth-provider.tsx  # ✅ Correct - redirectTo="/app"
app/(app)/_components/nav-user.tsx # ✅ Correct - Account links and sign-out
app/layout.tsx                     # ✅ Correct - Loads globals.css
app/(app)/layout.tsx               # ✅ Correct - App shell wrapper
proxy.ts                           # ✅ Correct - CSP with 'unsafe-inline' for styles
lib/server/auth/jwt.ts             # ✅ Correct - No debug logs
```

---

## 10. Implementation Timeline

### Phase 1: Critical Fixes (Immediate)
- [ ] Delete `app/account/layout.tsx`
- [ ] Update `app/account/[path]/page.tsx` with integrated header
- [ ] Test account pages (`/account/settings`, `/account/security`)
- [ ] Verify "Back to App" button works correctly

**Estimated Time**: 15 minutes  
**Blocker Risk**: High (currently blocking proper account rendering)

### Phase 2: Verification (After Phase 1)
- [ ] Run full auth flow test (sign-in → dashboard → account → back)
- [ ] Check browser console for errors (CSP, hydration, JWT)
- [ ] Verify all links in user menu work
- [ ] Test OAuth flows (Google, GitHub)

**Estimated Time**: 30 minutes  
**Dependencies**: Phase 1 completion

### Phase 3: Documentation (Optional)
- [ ] Add audit badges to pages
- [ ] Create wireframes for HITL validation
- [ ] Document final integration status

**Estimated Time**: 1 hour  
**Priority**: Medium (quality assurance)

---

## 11. Success Criteria

### ✅ Auth Pages
- Neon Auth UI renders with built-in CSS
- No custom wrapper layouts interfering
- OAuth buttons work (Google, GitHub)
- CSP allows inline styles (no violations)
- No hydration errors

### ✅ Account Pages
- "Back to App" button visible and functional
- Custom header uses globals.css/Tailwind
- AccountView uses Neon Auth CSS
- No layout wrapper conflict
- Navigation flow: App → Account → Back to App

### ✅ App Pages
- App shell renders with sidebar, header, breadcrumbs
- Uses globals.css and custom components
- User menu links to account pages
- Sign out redirects to auth

### ✅ Overall Integration
- Clean CSS separation (Neon Auth vs App Shell)
- No styling conflicts or overrides
- Proper navigation flow throughout app
- All pages render correctly with intended styles

---

## 12. References

### Documentation
- Neon Auth Setup: `NEON-AUTH-OAUTH-SETUP.md`
- CSP Fix: `CSP-NEON-AUTH-FIX.md`
- Architecture: `ARCHITECTURE.md`

### Key Files
- Root Layout: `app/layout.tsx`
- Auth Provider: `app/_components/auth-provider.tsx`
- Auth Pages: `app/auth/[path]/page.tsx`
- Account Pages: `app/account/[path]/page.tsx`
- App Shell: `app/(app)/layout.tsx`
- User Menu: `app/(app)/_components/nav-user.tsx`
- CSP Config: `proxy.ts`

### Dependencies
- `@neondatabase/neon-auth-react@0.2.0-beta.1`
- `next@16.1.6`
- `react@19.0.0`
- `tailwindcss@3.4.17`

---

**END OF IMPLEMENTATION GUIDE**
