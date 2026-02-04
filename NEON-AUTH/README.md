# NEON-AUTH - Complete Authentication System

A comprehensive, production-ready authentication system built with Next.js, TypeScript, and Neon Auth. This system provides a complete auth solution with email/password authentication, OAuth providers, email verification, password reset, and session management.

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Authentication Flow](#-authentication-flow)
- [Components](#-components)
- [API Integration](#-api-integration)
- [Customization](#-customization)
- [Security Considerations](#-security-considerations)
- [Troubleshooting](#-troubleshooting)

## 🚀 Features

### Core Authentication
- **Email/Password Authentication** - Secure login with validation
- **OAuth Providers** - Google and GitHub social login
- **Email Verification** - Required email verification for new accounts
- **Password Reset** - Secure password reset via email links
- **Session Management** - Multi-device session tracking and management

### UI/UX Features
- **Enterprise-grade Design** - Built with shadcn/ui components
- **Responsive Layout** - Mobile-first responsive design
- **Dark/Light Mode** - Theme toggle with system preference detection
- **Accessibility** - WCAG 2.1 AA compliant
- **Loading States** - Comprehensive loading and error states
- **Form Validation** - Real-time validation with helpful error messages

### Security Features
- **CSRF Protection** - Built-in CSRF token handling
- **Rate Limiting** - Protection against brute force attacks
- **hCaptcha Integration** - Optional captcha for suspicious activity
- **Secure Session Handling** - HTTP-only cookies with secure flags
- **OAuth State Management** - Secure OAuth flow with state parameters

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Auth Provider**: Neon Auth (`@neondatabase/auth/next`)
- **UI Library**: shadcn/ui + Tailwind CSS
- **Form Handling**: react-hook-form + Zod validation
- **State Management**: Zustand
- **Icons**: Lucide React + Radix Icons

### Key Architectural Decisions
1. **Single Route Strategy** - Canonical routes only (`/login`, `/register`, etc.)
2. **No Neon UI Components** - Custom implementation using shadcn/ui
3. **Type-safe Contracts** - Full TypeScript coverage with Zod schemas
4. **Centralized Constants** - All text strings in constants file
5. **Component Reusability** - Shared components across all auth pages

## 📁 Folder Structure

```
NEON-AUTH/
├── README.md                           # This file
├── app/(public)/(auth)/                 # Next.js app router auth pages
│   ├── account/[path]/                 # Account settings pages
│   │   └── page.tsx                    # Settings, security, organizations
│   ├── auth/[path]/                    # Legacy route redirects
│   │   └── page.tsx                    # Redirects to canonical routes
│   ├── auth/callback/                  # OAuth/email callback handler
│   │   └── page.tsx                    # Session finalization
│   ├── forgot-password/                # Password reset request
│   │   └── page.tsx                    # Email form for reset link
│   ├── login/                          # Sign-in page
│   │   └── page.tsx                    # Email/password + OAuth
│   ├── register/                       # Sign-up page
│   │   └── page.tsx                    # Registration with verification
│   ├── reset-password/                 # Password reset form
│   │   ├── page.tsx                    # Server wrapper with Suspense
│   │   └── reset-password-client.tsx   # Client component with form
│   ├── sign-out/                       # Sign-out dashboard
│   │   └── page.tsx                    # Session summary and sign-out
│   └── verify-email/                   # Email verification resend
│       └── page.tsx                    # Resend verification email
├── components/auth/                     # Reusable auth components
│   ├── auth-brand.tsx                  # AFENDA branding components
│   ├── auth-shell.tsx                  # Page wrapper component
│   ├── form-error.tsx                  # Error display component
│   ├── oauth-button.tsx                # Social login buttons
│   ├── icons/                          # Icon components
│   │   └── google-g-icon.tsx           # Google G logo
│   └── index.ts                        # Barrel exports
├── lib/                                # Core libraries
│   ├── auth/                           # Auth configuration
│   │   ├── client.ts                   # Neon Auth client setup
│   │   └── server.ts                   # Server-side auth helpers
│   ├── constants/                      # Configuration constants
│   │   └── auth.ts                     # All auth text/constants
│   └── contracts/                      # Type definitions
│       ├── auth/                       # Auth-specific schemas
│       │   ├── activity.ts             # Activity tracking
│       │   ├── index.ts                # Barrel exports
│       │   ├── login.ts                # Login schemas
│       │   ├── password-reset.ts       # Password reset schemas
│       │   └── register.ts             # Registration schemas
│       └── sessions.ts                 # Session management schemas
└── docs/                               # Documentation
    ├── AUTH-FLOW-WIREFRAME.md          # Complete flow documentation
    └── AUTH-THEME-TOGGLER-PLACEMENT.md # UI guidelines
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- Next.js 14+ project
- Neon database with Auth enabled

### Installation Steps

1. **Install Dependencies**
```bash
npm install @neondatabase/auth/next @neondatabase/auth/react
npm install @hookform/resolvers zod react-hook-form
npm install @radix-ui/react-icons lucide-react
npm install zustand
npm install @hcaptcha/react-hcaptcha  # Optional for captcha
```

2. **Copy Files**
   - Copy the entire `NEON-AUTH` folder to your project root
   - Ensure all folder paths match your project structure

3. **Configure Auth Routes**
   - Add auth routes to your Next.js app router
   - Update any imports to match your project paths

4. **Setup Neon Auth**
   - Enable Neon Auth in your Neon database
   - Configure OAuth providers in Neon console
   - Set redirect URLs to match your domain

## ⚙️ Environment Variables

Create `.env.local` with the following variables:

```env
# Neon Auth Configuration
NEON_DATABASE_URL=your_neon_database_url
NEXT_PUBLIC_NEON_AUTH_URL=your_neon_auth_url

# OAuth Providers (configured in Neon console)
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# GitHub OAuth  
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id

# hCaptcha (optional)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
HCAPTCHA_SECRET_KEY=your_hcaptcha_secret_key

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

## 🔄 Authentication Flow

### Registration Flow
1. User fills registration form (`/register`)
2. Account created in Neon Auth
3. Verification email sent automatically
4. User shown verification screen with resend option
5. User clicks verification link in email
6. Redirected to `/auth/callback` then to app

### Login Flow
1. User enters credentials (`/login`)
2. Optional captcha if suspicious activity
3. Credentials verified with Neon Auth
4. Session created and stored in secure cookie
5. Redirected to intended destination (`?next=` or `/app`)

### Password Reset Flow
1. User requests reset (`/forgot-password`)
2. Email with reset link sent
3. User clicks link (`/reset-password?token=...`)
4. New password set via secure form
5. Redirected to login with success message

### OAuth Flow
1. User clicks OAuth button (Google/GitHub)
2. Redirected to provider for authorization
3. Provider redirects to `/auth/callback`
4. Session created from OAuth profile
5. Redirected to intended destination

## 🧩 Components

### AuthShell
The main wrapper component for all auth pages:
```tsx
<AuthShell
  title="Sign in"
  description="Enter your credentials"
>
  <LoginForm />
</AuthShell>
```

Features:
- Centered card layout with gradient background
- Theme toggle in top-right corner
- AFENDA branding
- Responsive design

### OAuthButton
Standardized social login button:
```tsx
<OAuthButton
  provider="google"
  onClick={handleGoogleSignIn}
  isLoading={isPending}
/>
```

Features:
- Consistent styling for all providers
- Loading states with spinner
- Disabled state handling
- Provider-specific icons

### FormError
Unified error display component:
```tsx
<FormError
  title="Sign in failed"
  message={errorMessage}
  code={errorCode}
/>
```

Features:
- Consistent error styling
- Optional error codes
- Detailed error information
- Accessibility support

## 🔌 API Integration

### Auth Client Setup
```typescript
// lib/auth/client.ts
import { createAuthClient } from "@neondatabase/auth/next"

export const authClient = createAuthClient()
```

### Common Operations

#### Sign In
```typescript
const { error } = await authClient.signIn.email({
  email: "user@example.com",
  password: "password123",
  callbackURL: "/auth/callback"
})
```

#### Sign Up
```typescript
const { data, error } = await authClient.signUp.email({
  name: "John Doe",
  email: "user@example.com",
  password: "password123",
  callbackURL: "/auth/callback"
})
```

#### Sign Out
```typescript
await authClient.signOut()
```

#### Get Session
```typescript
const { data: session } = await authClient.getSession()
```

## 🎨 Customization

### Branding
Update `AUTH_BRAND` constants in `lib/constants/auth.ts`:
```typescript
export const AUTH_BRAND = {
  NAME: "YOUR_BRAND",
  SLOGAN: "YOUR_SLOGAN",
} as const
```

### Colors & Theme
The system uses Tailwind CSS with CSS variables for theming. Update your `tailwind.config.js` and CSS variables to match your brand.

### Text Labels
All text is centralized in `lib/constants/auth.ts`. Update any labels to match your application's tone and language.

### OAuth Providers
To add new OAuth providers:
1. Configure provider in Neon console
2. Update `OAuthButton` component with new provider
3. Add provider icon to `components/auth/icons/`
4. Update constants and types

## 🔒 Security Considerations

### Session Security
- Sessions stored in HTTP-only, secure cookies
- Automatic session expiration
- Secure session refresh mechanism

### OAuth Security
- State parameter validation
- PKCE implementation (handled by Neon Auth)
- Redirect URI validation

### Rate Limiting
- Built-in rate limiting for auth endpoints
- Captcha activation for suspicious activity
- Account lockout after failed attempts

### Data Validation
- All inputs validated with Zod schemas
- Server-side validation for critical operations
- XSS protection with proper escaping

## 🔧 Troubleshooting

### Common Issues

#### "Session not found" error
- Check Neon Auth configuration
- Verify NEXT_PUBLIC_NEON_AUTH_URL
- Ensure cookies are enabled in browser

#### OAuth redirect fails
- Verify redirect URIs in provider console
- Check NEXTAUTH_URL matches your domain
- Ensure OAuth keys are correctly configured

#### Email verification not working
- Check email configuration in Neon
- Verify email templates are set up
- Check spam folder for test emails

#### Captcha not loading
- Verify hCaptcha site key
- Check network connectivity to hcaptcha.com
- Ensure domain is whitelisted in hCaptcha console

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=@neondatabase/auth:*
```

### Getting Help
- Check the [Neon Auth Documentation](https://neon.tech/docs/auth)
- Review the flow documentation in `docs/AUTH-FLOW-WIREFRAME.md`
- Check browser console for detailed error messages

## 📝 License

This authentication system is part of the AFENDA project. Please ensure you have the proper licenses for all dependencies used.

## 🤝 Contributing

When contributing to this auth system:
1. Follow the existing code patterns
2. Add TypeScript types for new features
3. Update constants for any new text
4. Test all authentication flows
5. Update documentation as needed

---

Built with ❤️ using [Neon Auth](https://neon.tech/docs/auth) and [Next.js](https://nextjs.org/)
