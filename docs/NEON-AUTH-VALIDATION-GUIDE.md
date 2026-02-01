# Neon Auth Developer Credentials Validation Guide

## Overview

This guide provides a comprehensive checklist and validation process for setting up and verifying Neon Auth developer credentials for the AFENDA application.

---

## Quick Validation

Run the automated validation script:

```bash
npm run validate:neon-auth
# or
pnpm validate:neon-auth
```

This script checks:
- ✅ All required environment variables are set
- ✅ Variable formats are valid
- ✅ Endpoint accessibility
- ✅ Database connectivity
- ✅ OAuth configuration

---

## Required Environment Variables

### 1. **DATABASE_URL** (Critical)

**Purpose:** PostgreSQL connection string to your Neon database

**Format:**
```
postgresql://[username]:[password]@[host]/[database]?sslmode=require&channel_binding=require
```

**Example:**
```
DATABASE_URL=postgresql://neondb_owner:npg_ljY4G2SeHrBO@ep-fancy-wildflower-a1o82bpk-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**How to Get It:**
1. Go to [neon.tech console](https://console.neon.tech)
2. Select your project → Main branch
3. Click "Connect" → Select "Connection string"
4. Copy the full connection string

**Validation:**
```bash
# Test database connection
psql "$DATABASE_URL"
```

---

### 2. **NEON_PROJECT_ID** (Critical)

**Purpose:** Your Neon project identifier

**Format:** UUID or project name

**Example:**
```
NEON_PROJECT_ID=dark-band-87285012
```

**How to Get It:**
1. Go to [neon.tech console](https://console.neon.tech)
2. Select your project
3. Project ID shown in URL: `https://console.neon.tech/app/projects/{PROJECT_ID}`

**Validation:**
```bash
# List your projects
neonctl projects list
```

---

### 3. **NEON_AUTH_BASE_URL** (Critical)

**Purpose:** Base URL for Neon Auth API endpoints

**Format:**
```
https://[endpoint].neonauth.[region].aws.neon.tech/[database]/auth
```

**Example:**
```
NEON_AUTH_BASE_URL=https://ep-fancy-wildflower-a1o82bpk.neonauth.ap-southeast-1.aws.neon.tech/neondb/auth
```

**How to Get It:**
1. Go to [neon.tech console](https://console.neon.tech)
2. Select your project → Dashboard
3. Look for "Auth" section or check your connection endpoint
4. Replace `.apirest.` with `.neonauth.` in your endpoint

**Validation:**
```bash
# Check if endpoint responds
curl -X OPTIONS https://ep-fancy-wildflower-a1o82bpk.neonauth.ap-southeast-1.aws.neon.tech/neondb/auth -v
```

---

### 4. **JWKS_URL** (Critical)

**Purpose:** JSON Web Key Set endpoint for JWT validation

**Format:**
```
https://[endpoint].neonauth.[region].aws.neon.tech/[database]/auth/.well-known/jwks.json
```

**Example:**
```
JWKS_URL=https://ep-fancy-wildflower-a1o82bpk.neonauth.ap-southeast-1.aws.neon.tech/neondb/auth/.well-known/jwks.json
```

**How to Get It:**
1. Derive from `NEON_AUTH_BASE_URL`
2. Append `/.well-known/jwks.json`

**Validation:**
```bash
# Fetch JWKS
curl https://ep-fancy-wildflower-a1o82bpk.neonauth.ap-southeast-1.aws.neon.tech/neondb/auth/.well-known/jwks.json
```

Expected response:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "...",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

---

### 5. **NEON_DATA_API_URL** (Critical)

**Purpose:** Neon Data API endpoint for HTTP-based database access

**Format:**
```
https://[endpoint].apirest.[region].aws.neon.tech/[database]/rest/v1
```

**Example:**
```
NEON_DATA_API_URL=https://ep-fancy-wildflower-a1o82bpk.apirest.ap-southeast-1.aws.neon.tech/neondb/rest/v1
```

**How to Get It:**
1. Go to Neon console → Your project
2. Find the Data API endpoint
3. Or derive from DATABASE_URL endpoint

**Validation:**
```bash
# Check endpoint health
curl -X OPTIONS https://ep-fancy-wildflower-a1o82bpk.apirest.ap-southeast-1.aws.neon.tech/neondb/rest/v1 -v
```

---

## Optional Environment Variables

### **NEON_JWT_SECRET**

**Purpose:** Secret key for JWT token signing

**Format:** Base64-encoded string (min 32 characters)

**Example:**
```
NEON_JWT_SECRET=S2Bq5ptcyWZAalg3ptFWpc9mKPaAghUGyVUdvdKQhU0=
```

**How to Generate:**
```bash
# Generate a secure random key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Note:** If not provided, Neon Auth will generate one automatically

---

### **NEON_AUTH_COOKIE_SECRET**

**Purpose:** Secret for encrypting auth cookies

**Format:** Base64-encoded string (min 32 characters)

**Example:**
```
NEON_AUTH_COOKIE_SECRET=rnIcCj8LoFwvuznP6kXTBr2w0J/f+Ezx/JHQVrAuFIE=
```

**How to Generate:**
```bash
# Generate a secure random key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

### **NEON_API_KEY**

**Purpose:** API key for Neon CLI operations and GitHub Actions

**Format:** napi_* format

**Example:**
```
NEON_API_KEY=napi_pbu7zv32cluaofcpfh24o3r9buq4q104qg7vxtjj6l1tfrcqpmb1xq6558s9exwc
```

**How to Get It:**
1. Go to [Neon Console](https://console.neon.tech/app/settings/api-keys)
2. Create a new API key
3. Copy immediately (cannot be viewed again)

---

## OAuth Configuration

### **GOOGLE_CLIENT_ID**

**Purpose:** Google OAuth 2.0 Client ID

**Example:**
```
GOOGLE_CLIENT_ID=1044662705377-r68bil6v9v8sjl6mh3aphjura1ltgqbb.apps.googleusercontent.com
```

**How to Get It:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

---

### **GOOGLE_CLIENT_SECRET**

**Purpose:** Google OAuth 2.0 Client Secret

**Example:**
```
GOOGLE_CLIENT_SECRET=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
```

**⚠️ IMPORTANT:** Never commit this to version control

---

### **GITHUB_ID**

**Purpose:** GitHub OAuth App ID

**Example:**
```
GITHUB_ID=Ov23lizviCIntRW1pBJx
```

**How to Get It:**
1. Go to [GitHub Settings → Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps"
3. Create a new OAuth App
4. Set Authorization callback URL:
   ```
   http://localhost:3000/api/auth/callback/github
   ```

---

### **GITHUB_SECRET**

**Purpose:** GitHub OAuth App Secret

**Example:**
```
GITHUB_SECRET=c027b30234c280b6e10a7e03915c8bce9e9a4e77
```

**⚠️ IMPORTANT:** Never commit this to version control

---

## Validation Checklist

### Prerequisites

- [ ] Node.js 18+ installed
- [ ] PostgreSQL/psql available (for database testing)
- [ ] curl or similar HTTP client available
- [ ] Internet connection for endpoint validation

### Required Variables

- [ ] `DATABASE_URL` set and valid
- [ ] `NEON_PROJECT_ID` set
- [ ] `NEON_AUTH_BASE_URL` set with correct format
- [ ] `JWKS_URL` set with correct format
- [ ] `NEON_DATA_API_URL` set with correct format

### Functionality Tests

- [ ] Database connection works:
  ```bash
  psql "$DATABASE_URL" -c "SELECT NOW();"
  ```

- [ ] JWKS endpoint is accessible:
  ```bash
  curl "$JWKS_URL" | jq .
  ```

- [ ] Neon Auth endpoint responds:
  ```bash
  curl -X OPTIONS "$NEON_AUTH_BASE_URL" -v
  ```

### OAuth Configuration

- [ ] At least one OAuth provider configured
- [ ] Google OAuth (optional but recommended):
  - [ ] `GOOGLE_CLIENT_ID` set
  - [ ] `GOOGLE_CLIENT_SECRET` set
  - [ ] Callback URL registered in Google Console

- [ ] GitHub OAuth (optional but recommended):
  - [ ] `GITHUB_ID` set
  - [ ] `GITHUB_SECRET` set
  - [ ] Callback URL registered in GitHub Settings

### Application Configuration

- [ ] `NEXT_PUBLIC_APP_URL` set to development server URL
- [ ] `NEXT_PUBLIC_SITE_URL` set to production URL
- [ ] `NODE_ENV` set to "development"

---

## Common Issues & Solutions

### ❌ "Database connection refused"

**Cause:** DATABASE_URL is invalid or database is unreachable

**Solution:**
1. Verify DATABASE_URL in .env.local
2. Check Neon console for active compute
3. Verify IP whitelist (Neon allows all by default)
4. Test with psql directly

```bash
psql "$DATABASE_URL"
```

---

### ❌ "Invalid JWKS endpoint"

**Cause:** JWKS_URL has wrong format or Auth not provisioned

**Solution:**
1. Verify endpoint format
2. Check that Neon Auth is provisioned
3. Test endpoint with curl:

```bash
curl "$JWKS_URL"
```

---

### ❌ "Neon Auth endpoint not responding"

**Cause:** Auth service not deployed or endpoint offline

**Solution:**
1. Verify NEON_AUTH_BASE_URL format
2. Check Neon console for Auth status
3. Ensure Auth is properly provisioned
4. Test endpoint:

```bash
curl -X OPTIONS "$NEON_AUTH_BASE_URL" -v
```

---

### ❌ "OAuth callback URL mismatch"

**Cause:** Registered callback URL doesn't match environment

**Solution:**
1. Verify `NEXT_PUBLIC_APP_URL` in .env.local
2. Register callback URL in Google/GitHub:
   ```
   {NEXT_PUBLIC_APP_URL}/api/auth/callback/google
   {NEXT_PUBLIC_APP_URL}/api/auth/callback/github
   ```

---

## Running Validation

### Automated Validation

```bash
# Run the validation script
npm run validate:neon-auth

# Expected output:
# ✅ All required Neon Auth variables are configured correctly
# ✅ OAuth configured: 2 provider(s)
# ✅ Neon Auth developer credentials are properly configured!
```

### Manual Validation

```bash
# 1. Check environment variables
grep -E "NEON|JWKS|DATABASE_URL" .env.local

# 2. Test database connection
psql "$DATABASE_URL" -c "SELECT NOW();"

# 3. Test JWKS endpoint
curl "$JWKS_URL" | jq '.keys | length'

# 4. Test Neon Auth endpoint
curl -X OPTIONS "$NEON_AUTH_BASE_URL" -v

# 5. List Neon projects
neonctl projects list
```

---

## Production Deployment

### Before Deploying:

1. ✅ All validation checks pass
2. ✅ OAuth callback URLs updated to production domain
3. ✅ Secrets stored in production secret manager (not .env.local)
4. ✅ Database has sufficient compute for production load
5. ✅ Backup strategy in place
6. ✅ Monitoring enabled

### Production Environment Variables:

```bash
# Use secure secret management (e.g., Vercel, AWS Secrets Manager)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NODE_ENV=production

# Database & Auth (from secret manager)
DATABASE_URL=<production-connection-string>
NEON_PROJECT_ID=<project-id>
NEON_AUTH_BASE_URL=<production-auth-url>
JWKS_URL=<production-jwks-url>
NEON_DATA_API_URL=<production-data-api-url>

# Secrets (rotate regularly)
NEON_JWT_SECRET=<secure-secret>
NEON_AUTH_COOKIE_SECRET=<secure-secret>
NEON_API_KEY=<api-key>

# OAuth (from provider dashboards)
GOOGLE_CLIENT_ID=<production-google-id>
GOOGLE_CLIENT_SECRET=<secure-secret>
GITHUB_ID=<production-github-id>
GITHUB_SECRET=<secure-secret>
```

---

## References

- [Neon Documentation](https://neon.tech/docs)
- [Neon Auth Guide](https://neon.tech/docs/guides/neon-auth)
- [Neon Data API](https://neon.tech/docs/guides/neon-data-api)
- [Better Auth Documentation](https://better-auth.com)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)

---

## Support

For issues:
1. Run `npm run validate:neon-auth` to diagnose
2. Check [Neon Documentation](https://neon.tech/docs)
3. Review [GitHub Issues](https://github.com/neondatabase/neon/issues)
4. Contact Neon Support via console

---

**Last Updated:** February 1, 2026  
**Status:** ✅ ACTIVE - All validation scripts tested and operational
