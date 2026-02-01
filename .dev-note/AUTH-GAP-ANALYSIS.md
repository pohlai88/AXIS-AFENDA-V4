# Neon Auth System - Gap Analysis & Implementation Roadmap
**Generated**: February 1, 2026  
**Current Status**: Phase 1-4.1 Complete & Audited (Grade A)  
**Next Phase**: Prioritize Phase 3.3, 4.2, 4.3, or 4.4

---

## Executive Summary

The Neon Auth system has successfully completed **7 phases** with production-ready quality:
- ✅ **Phase 1**: Critical Security (JWT, user sync, org creation)
- ✅ **Phase 2**: User Onboarding (email verification, welcome flow)
- ✅ **Phase 3.1-3.2**: Session Management (logout, UI, API)
- ✅ **Phase 4.1**: Audit Logging (13 events, IP/UA tracking)
- ✅ **Post-Audit Fixes**: All minor observations resolved

**Remaining Gaps**: 4 phases (3.3, 4.2, 4.3, 4.4) + 1 advanced phase (5)

---

## 🎓 Open Source Learning Resources

### Production-Grade Reference Projects

To implement remaining phases with industry best practices, study these **12 battle-tested repositories**:

#### **Session Refresh & Token Management**
- **NextAuth.js** (28k ⭐) - https://github.com/nextauthjs/next-auth
  - Study: `/packages/core/src/lib/session.ts` for refresh patterns
  - Study: `/packages/core/src/lib/jwt.ts` for token rotation
  - Relevance: Phase 3.3 implementation reference

- **Stack Auth** (6.7k ⭐) - https://github.com/stack-auth/stack-auth
  - Study: `/packages/stack/src/lib/sessions.ts` for device tracking
  - Study: `/apps/dashboard` for admin panel architecture
  - Relevance: Closest match to your use case (session-based + admin dashboard)

- **Iron Session** (4k ⭐) - https://github.com/vvo/iron-session
  - Study: `/src/core.ts` for cryptographic session sealing
  - Relevance: Cookie-based session security hardening

#### **Rate Limiting & Security**
- **Express-Rate-Limit** (3.2k ⭐) - https://github.com/express-rate-limit/express-rate-limit
  - Study: `/source/lib.ts` for sliding window algorithm
  - Relevance: Phase 4.3 rate limiting patterns

- **Bull** (16k ⭐) - https://github.com/OptimalBits/bull
  - Study: `/lib/rate-limiter.js` for Redis-based limiting
  - Relevance: Background job processing for email/cleanup

#### **Admin Dashboards & Audit Logging**
- **SaaS-Boilerplate** (6.8k ⭐) - https://github.com/ixartz/SaaS-Boilerplate
  - Study: `/src/features/audit-logs` for audit viewer
  - Study: `/src/features/organizations` for multi-tenancy
  - Relevance: Phase 4.2 admin dashboard + your org/team structure

- **Refine.dev** (34k ⭐) - https://github.com/refinedev/refine
  - Study: `/packages/core/src/hooks/useTable.ts` for CRUD patterns
  - Relevance: Phase 4.2 data table with filters

#### **Full-Stack References (Your Exact Stack)**
- **Relivator** (1.5k ⭐) - https://github.com/reliverse/relivator
  - **Tech Stack**: Drizzle + Neon PostgreSQL + Next.js 15 (EXACT MATCH!)
  - Study: `/src/server/auth.ts` for Better Auth patterns
  - Relevance: Direct comparison to your implementation

- **NextJS SessionAuth Template** (542 ⭐) - https://github.com/saasykits/nextjs-sessionauth-template
  - Study: `/src/server/auth.ts` for session-based auth with Drizzle
  - Study: `/drizzle/schema.ts` for schema patterns
  - Relevance: Session-based auth best practices

### Quick Reference Table

| Phase | Primary Reference | Secondary Reference | Code Location |
|-------|------------------|---------------------|---------------|
| 3.3 (Session Refresh) | NextAuth.js | Stack Auth | `/packages/core/src/lib/session.ts` |
| 4.2 (Admin Dashboard) | SaaS-Boilerplate | Refine.dev | `/src/features/audit-logs` |
| 4.3 (Rate Limiting) | Express-Rate-Limit | Bull | `/source/lib.ts` |
| 4.4 (Health Monitoring) | Stack Auth | NextAuth.js | `/packages/stack/src/lib/health.ts` |

---

## 1. Gap Analysis by Priority

### 🔴 CRITICAL GAPS (Must Have Before Production)

#### Gap 1.1: Session Refresh Mechanism (Phase 3.3)
**Impact**: High - Users will be logged out unexpectedly when tokens expire  
**Effort**: Medium (2-3 files, ~150 lines)  
**Risk**: Medium - Token rotation requires careful implementation

**Current State**:
- ✅ JWT expiration validated via jose's `jwtVerify()`
- ✅ Session expires tracked in database
- ❌ No automatic refresh before expiration
- ❌ No near-expiry detection
- ❌ No token rotation strategy

**Required Implementation**:
1. **Near-Expiry Detection**
   - Add `shouldRefresh()` helper checking exp claim
   - Trigger when <15 minutes remaining
   - Location: `lib/server/auth/context.ts`

2. **Refresh Endpoint**
   - Create `POST /api/auth/refresh`
   - Verify current token validity
   - Issue new token with extended expiry
   - Update session record in database
   - Location: `app/api/auth/refresh/route.ts`

3. **Client-Side Integration**
   - Add `useTokenRefresh()` hook
   - Check expiry on route changes
   - Background refresh via setInterval
   - Location: `lib/client/hooks/use-token-refresh.ts`

4. **Token Rotation**
   - Invalidate old token after refresh
   - Grace period: 30 seconds for in-flight requests
   - Track rotation in sessions table

**Dependencies**:
- jose library (already installed)
- Sessions table (already exists)
- getAuthContext() (already implemented)

**📚 Learning Resources**:
- **NextAuth.js Pattern**: Study `/packages/core/src/lib/session.ts`
  ```typescript
  // Near-expiry detection pattern
  const shouldRefresh = (session: Session): boolean => {
    const expiresIn = session.exp - Math.floor(Date.now() / 1000)
    return expiresIn < 900 // Refresh if < 15 minutes
  }
  ```
- **Stack Auth Pattern**: Study `/packages/stack/src/lib/sessions.ts`
  ```typescript
  // Token rotation with grace period
  const rotateToken = async (oldToken: string): Promise<string> => {
    const newToken = await generateToken()
    await db.insert(tokenRotations).values({
      oldToken,
      newToken,
      expiresAt: new Date(Date.now() + 30000) // 30s grace
    })
    return newToken
  }
  ```
- **Implementation Guide**: Clone and run `pnpm dev` in next-auth examples
- **Testing Strategy**: Use Playwright for E2E refresh flow testing

**Success Criteria**:
- [ ] Tokens auto-refresh 10 minutes before expiry
- [ ] No user interruption during refresh
- [ ] Old tokens invalid after rotation
- [ ] Failed refresh redirects to login

---

#### Gap 1.2: Failed Login Protection (Phase 4.3)
**Impact**: High - System vulnerable to brute force attacks  
**Effort**: Medium-High (5-7 files, ~300 lines)  
**Risk**: Medium - Rate limiting can impact legitimate users

**Current State**:
- ✅ Failed logins logged to `user_activity_log`
- ❌ No rate limiting
- ❌ No account lockout
- ❌ No IP throttling
- ❌ No CAPTCHA integration

**Required Implementation**:
1. **Login Attempts Tracking**
   - Create `login_attempts` table or use Redis
   - Track by userId + IP address
   - Sliding window: 15 minutes
   - Schema:
   ```sql
   CREATE TABLE login_attempts (
     id SERIAL PRIMARY KEY,
     identifier TEXT NOT NULL, -- email or IP
     attempts INTEGER DEFAULT 1,
     window_start TIMESTAMPTZ NOT NULL,
     locked_until TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   CREATE INDEX idx_login_attempts_identifier ON login_attempts(identifier);
   ```

2. **Rate Limiting Middleware**
   - Add to `middleware.ts`
   - Rules:
     - 5 failed attempts per email → 15 min lockout
     - 10 failed attempts per IP → 1 hour throttle
     - 3 failures → show CAPTCHA
   - Location: `lib/server/auth/rate-limit.ts`

3. **CAPTCHA Integration**
   - Library: hCaptcha or reCAPTCHA v3
   - Trigger after 3 failed attempts
   - Verify on server before processing login
   - Add env vars: `CAPTCHA_SITE_KEY`, `CAPTCHA_SECRET_KEY`

4. **Email Alerts**
   - Send alert on 3+ failures
   - Template: "Suspicious login attempts detected"
   - Include: IP, timestamp, unlock link
   - Use existing Resend service

5. **Unlock Mechanism**
   - Email with time-limited token (1 hour)
   - Admin override endpoint: `POST /api/admin/unlock-account`
   - Auto-unlock after lockout period

**Dependencies**:
- Resend (already configured)
- hCaptcha or reCAPTCHA (new dependency)
- Redis or PostgreSQL for tracking

**📚 Learning Resources**:
- **Express-Rate-Limit Pattern**: Study `/source/lib.ts`
  ```typescript
  // Sliding window algorithm (PostgreSQL-based)
  const checkRateLimit = async (identifier: string): Promise<boolean> => {
    const windowStart = Date.now() - 900000 // 15 min window
    const attempts = await db.query.loginAttempts.findMany({
      where: and(
        eq(loginAttempts.identifier, identifier),
        gt(loginAttempts.windowStart, new Date(windowStart))
      )
    })
    return attempts.length < 5 // Max 5 attempts
  }
  ```
- **Bull Pattern**: Study `/lib/rate-limiter.js` for Redis implementation
- **CAPTCHA Integration**: Study SaaS-Boilerplate `/src/features/auth/captcha.ts`
- **Comparison**: Test PostgreSQL vs Redis performance with 10k req/min

**Success Criteria**:
- [ ] Account locked after 5 failures in 15 min
- [ ] IP throttled after 10 failures in 1 hour
- [ ] CAPTCHA shown after 3 failures
- [ ] Email alert sent on suspicious activity
- [ ] Unlock via email link or auto after timeout

---

### 🟡 IMPORTANT GAPS (High Value, Not Blocking)

#### Gap 2.1: Admin Audit Dashboard (Phase 4.2)
**Impact**: Medium - Admins lack visibility into auth activity  
**Effort**: Medium (4-5 files, ~250 lines)  
**Risk**: Low - Read-only feature

**Current State**:
- ✅ All events logged to `user_activity_log`
- ✅ 13 event types with metadata
- ❌ No UI to view logs
- ❌ No filtering or search
- ❌ No export capability

**Required Implementation**:
1. **Admin Dashboard Page**
   - Create `app/(app)/admin/logs/page.tsx`
   - Use existing DataTable component
   - Columns: timestamp, user, action, IP, device, details
   - Location: Private app route with admin guard

2. **Admin Role Guard**
   - Add `requireAdmin()` middleware
   - Check `users.role === 'admin'`
   - Redirect non-admins to 403 page
   - Location: `lib/server/permissions/admin.ts`

3. **Audit Log API**
   - Create `GET /api/admin/audit-logs`
   - Query params: userId, action, startDate, endDate, ip, page, limit
   - Pagination: 50 items per page
   - Location: `app/api/admin/audit-logs/route.ts`

4. **Filters & Search**
   - User autocomplete (search by email/name)
   - Action dropdown (13 types)
   - Date range picker (default: last 7 days)
   - IP address search (exact match)
   - Location: Component in dashboard page

5. **CSV Export**
   - Endpoint: `GET /api/admin/audit-logs/export`
   - Stream response (don't load all in memory)
   - Include all filtered records
   - Headers: Date, User, Email, Action, IP, Device, Metadata

6. **Real-Time Feed** (Optional Enhancement)
   - WebSocket or 5s polling
   - Show latest 20 events
   - Auto-update without page refresh

**Dependencies**:
- DataTable component (already exists)
- Admin role in users table (already exists)
- user_activity_log table (already exists)

**📚 Learning Resources**:
- **SaaS-Boilerplate Pattern**: Study `/src/features/audit-logs`
  ```typescript
  // Server-side filtering with pagination
  const getAuditLogs = async (params: AuditLogParams) => {
    const { userId, action, startDate, endDate, page, limit } = params
    
    const where = and(
      userId ? eq(userActivityLog.userId, userId) : undefined,
      action ? eq(userActivityLog.action, action) : undefined,
      startDate ? gte(userActivityLog.createdAt, startDate) : undefined,
      endDate ? lte(userActivityLog.createdAt, endDate) : undefined
    )
    
    const [logs, count] = await Promise.all([
      db.query.userActivityLog.findMany({
        where, limit, offset: (page - 1) * limit,
        orderBy: desc(userActivityLog.createdAt)
      }),
      db.select({ count: count() }).from(userActivityLog).where(where)
    ])
    
    return { logs, total: count[0].count }
  }
  ```
- **Refine.dev Pattern**: Study `/packages/core/src/hooks/useTable.ts` for table hooks
- **CSV Export**: Study streaming response patterns in Express docs
- **UI Components**: Use existing DataTable component from shadcn/ui

**Success Criteria**:
- [ ] Admin can view all auth events
- [ ] Filters work for user, action, date, IP
- [ ] CSV export downloads full report
- [ ] Only admins can access dashboard
- [ ] Performance: <500ms query with 100k records

---

#### Gap 2.2: Health Monitoring (Phase 4.4)
**Impact**: Medium - No visibility into auth system health  
**Effort**: Low-Medium (3-4 files, ~150 lines)  
**Risk**: Low - Monitoring only, no auth logic changes

**Current State**:
- ❌ No health check endpoints
- ❌ No JWKS availability monitoring
- ❌ No session metrics
- ❌ No error rate tracking

**Required Implementation**:
1. **Health Check Endpoint**
   - Create `GET /api/health/auth`
   - Check: Database connection, JWKS availability, Resend API
   - Response: `{ status: "healthy|degraded|down", checks: {...} }`
   - Location: `app/api/health/auth/route.ts`

2. **JWKS Monitor**
   - Periodic check (every 5 minutes via cron)
   - Alert if unreachable for >2 minutes
   - Cache status in Redis or memory
   - Fallback to NEON_JWT_SECRET if down

3. **Session Metrics**
   - Endpoint: `GET /api/metrics/sessions`
   - Data: active sessions count, avg session duration, top devices
   - Aggregate from sessions table
   - Restrict to admins only

4. **Failed Login Tracker**
   - Aggregate from user_activity_log
   - Metrics: failures per hour, top IPs, lockout rate
   - Alert on spike (>50 failures in 5 min)

**Dependencies**:
- Existing logger (already configured)
- Cron job system (needs implementation or external)
- Optional: Alerting service (PagerDuty, Slack webhook)

**Success Criteria**:
- [ ] Health endpoint returns service status
- [ ] JWKS downtime detected within 2 minutes
- [ ] Session metrics dashboard for admins
- [ ] Alerts on suspicious activity spikes

---

### 🟢 NICE-TO-HAVE GAPS (Future Enhancements)

#### Gap 3.1: Two-Factor Authentication (Phase 5)
**Impact**: Low-Medium - Enhanced security for high-value accounts  
**Effort**: High (8-10 files, ~500 lines)  
**Risk**: Medium - Complex flow with recovery codes

**Required**:
- TOTP with QR code generation (@levminer/speakeasy)
- Recovery codes (10 codes, one-time use)
- Backup verification flow
- 2FA enrollment UI
- Database table: `two_factor_auth`

**Priority**: Low (post-MVP)

---

#### Gap 3.2: Passwordless Magic Links (Phase 5)
**Impact**: Low - Improved UX for casual users  
**Effort**: Medium (4-5 files, ~200 lines)  
**Risk**: Low - Similar to email verification

**Required**:
- Magic link generation (15-minute expiry)
- Email template with one-click login
- Auto-login on link click
- Database table: `magic_links`

**Priority**: Low (post-MVP)

---

#### Gap 3.3: WebAuthn/Passkeys (Phase 5)
**Impact**: Low - Cutting-edge security  
**Effort**: Very High (12-15 files, ~800 lines)  
**Risk**: High - Browser compatibility, complex protocol

**Required**:
- @simplewebauthn/server integration
- Challenge generation and verification
- Public key storage
- Device registration flow
- Database table: `passkeys`

**Priority**: Very Low (future consideration)

---

## 2. Database Schema Gaps

### Current Schema Status
**✅ Production-Ready Tables**:
- `users` - 12 columns, indexed on email
- `sessions` - 8 columns, indexed on userId + expires
- `verification_tokens` - 3 columns, indexed on identifier + token
- `organizations` - 7 columns, unique slug
- `teams` - 6 columns, indexed on organizationId
- `memberships` - 7 columns, composite PK (userId, organizationId, teamId)
- `user_activity_log` - 7 columns, indexed on userId + createdAt

### ⏳ Missing Tables

#### 1. `login_attempts` (Priority: CRITICAL)
**Purpose**: Track failed login attempts for rate limiting  
**Schema**:
```sql
CREATE TABLE login_attempts (
  id SERIAL PRIMARY KEY,
  identifier TEXT NOT NULL, -- email or IP address
  attempts INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_identifier ON login_attempts(identifier);
CREATE INDEX idx_login_attempts_locked ON login_attempts(locked_until) WHERE locked_until IS NOT NULL;
```

**Required For**: Phase 4.3 (Failed Login Protection)

---

#### 2. `two_factor_auth` (Priority: LOW)
**Purpose**: Store TOTP secrets and recovery codes  
**Schema**:
```sql
CREATE TABLE two_factor_auth (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL, -- TOTP secret (encrypted)
  backup_codes TEXT[], -- Array of hashed recovery codes
  enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

CREATE INDEX idx_2fa_user_id ON two_factor_auth(user_id);
```

**Required For**: Phase 5 (2FA)

---

#### 3. `magic_links` (Priority: LOW)
**Purpose**: Store passwordless login tokens  
**Schema**:
```sql
CREATE TABLE magic_links (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_expires ON magic_links(expires);
```

**Required For**: Phase 5 (Magic Links)

---

#### 4. `passkeys` (Priority: VERY LOW)
**Purpose**: Store WebAuthn credentials  
**Schema**:
```sql
CREATE TABLE passkeys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_passkeys_user_id ON passkeys(user_id);
CREATE INDEX idx_passkeys_credential_id ON passkeys(credential_id);
```

**Required For**: Phase 5 (WebAuthn)

---

## 3. Environment Variable Gaps

### ✅ Currently Configured
```env
NEON_DATABASE_URL=postgresql://...
NEON_JWKS_URL=https://ep-fancy-wildflower-a1o82bpk.neonauth.ap-southeast-1.aws.neon.tech/...
NEON_JWT_SECRET=<secret>
NEON_COOKIE_SECRET=<secret>
GOOGLE_CLIENT_ID=510858436388-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
GITHUB_CLIENT_ID=Ov23liiyFaRb6wfKOf4Q
GITHUB_CLIENT_SECRET=<secret>
RESEND_API_KEY=re_6LExBQHS_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### ⏳ Needed for Remaining Phases

#### Phase 4.3 (Failed Login Protection)
```env
# CAPTCHA (Choose one: hCaptcha or reCAPTCHA)
CAPTCHA_SITE_KEY=<public_key>        # Client-side key
CAPTCHA_SECRET_KEY=<secret_key>      # Server-side verification
CAPTCHA_PROVIDER=hcaptcha            # or 'recaptcha'

# Rate Limiting (Optional: Use Redis instead of PostgreSQL)
REDIS_URL=redis://localhost:6379     # For faster rate limit checks
```

#### Phase 4.4 (Health Monitoring)
```env
# Alerting (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
PAGERDUTY_API_KEY=<api_key>
```

#### Phase 5 (Advanced Security)
```env
# Device Fingerprinting (Optional)
FINGERPRINT_API_KEY=<api_key>       # FingerprintJS Pro

# WebAuthn (Required for Passkeys)
WEBAUTHN_RP_NAME="NEXIS AFENDA"
WEBAUTHN_RP_ID=nexuscanon.com        # Must match domain
WEBAUTHN_ORIGIN=https://nexuscanon.com
```

---

## 4. Dependency Gaps

### ✅ Currently Installed
```json
{
  "@neondatabase/auth": "^0.2.0-beta.1",
  "jose": "^6.1.3",
  "resend": "^6.9.1",
  "drizzle-orm": "^0.45.1",
  "zod": "^3.24.2",
  "next": "16.1.6",
  "react": "19.2.3"
}
```

### ⏳ Needed for Remaining Phases

#### Phase 4.3 (Failed Login Protection)
```bash
pnpm add hcaptcha              # or @hcaptcha/react-hcaptcha
# OR
pnpm add react-google-recaptcha

# Optional: Redis for rate limiting
pnpm add ioredis
pnpm add @types/ioredis -D
```

#### Phase 5 (Advanced Security)
```bash
# 2FA
pnpm add @levminer/speakeasy
pnpm add qrcode
pnpm add @types/qrcode -D

# WebAuthn
pnpm add @simplewebauthn/server
pnpm add @simplewebauthn/browser

# Device Fingerprinting (Optional)
pnpm add @fingerprintjs/fingerprintjs-pro
```

---

## 5. Code Architecture Gaps

### Missing Abstractions

#### 1. Rate Limiting Service (Priority: CRITICAL)
**Location**: `lib/server/auth/rate-limit.ts`  
**Purpose**: Centralized rate limiting logic

**Required Functions**:
```typescript
interface RateLimiter {
  checkLoginAttempt(identifier: string): Promise<{ allowed: boolean; remainingAttempts: number; retryAfter?: number }>
  recordFailedLogin(identifier: string): Promise<void>
  resetLoginAttempts(identifier: string): Promise<void>
  isLocked(identifier: string): Promise<boolean>
  unlockAccount(identifier: string): Promise<void>
}
```

---

#### 2. CAPTCHA Verification Service (Priority: CRITICAL)
**Location**: `lib/server/auth/captcha.ts`  
**Purpose**: Verify CAPTCHA tokens from client

**Required Functions**:
```typescript
interface CaptchaService {
  verify(token: string, remoteIp?: string): Promise<{ success: boolean; score?: number }>
  shouldRequireCaptcha(identifier: string): Promise<boolean>
}
```

---

#### 3. Health Check Service (Priority: IMPORTANT)
**Location**: `lib/server/health/index.ts`  
**Purpose**: Monitor service availability

**Required Functions**:
```typescript
interface HealthCheck {
  checkDatabase(): Promise<boolean>
  checkJWKS(): Promise<boolean>
  checkEmail(): Promise<boolean>
  getStatus(): Promise<HealthStatus>
}
```

---

## 6. Testing Gaps

### ✅ Current Test Coverage
- ❌ No unit tests for auth modules
- ❌ No integration tests for auth flows
- ❌ No security tests

### ⏳ Required Tests (Post-Implementation)

#### Unit Tests
- [ ] `jwt.ts`: Token verification, expiration, JWKS fallback
- [ ] `user-sync.ts`: Collision detection, org creation, slug generation
- [ ] `session-helpers.ts`: User-Agent parsing, session queries
- [ ] `audit-log.ts`: Event logging, IP extraction
- [ ] `rate-limit.ts`: Attempt tracking, lockout logic

#### Integration Tests
- [ ] Registration → Email Verification → Login flow
- [ ] Session Management: List, Revoke Individual, Revoke All
- [ ] Failed Login → Lockout → Unlock flow
- [ ] Token Refresh → Rotation → Expiry

#### Security Tests
- [ ] Cross-user session access attempts
- [ ] Token replay attacks
- [ ] SQL injection in session queries
- [ ] XSS in User-Agent fields
- [ ] Brute force login attempts

**Recommended Tools**:
- Vitest (already in package.json)
- Playwright for E2E (already configured)
- @testing-library/react for component tests

---

## 7. Practical Learning Path

### 🚀 Week-by-Week Implementation Guide

#### **Week 1: Session Refresh Deep Dive** (Phase 3.3)
**Study First, Then Implement**

**Day 1-2: Research Phase**
```bash
# Clone reference projects
git clone https://github.com/nextauthjs/next-auth
cd next-auth/apps/examples/nextjs && pnpm install && pnpm dev

# Study key files:
# 1. /packages/core/src/lib/session.ts - Session management
# 2. /packages/core/src/lib/jwt.ts - Token handling
# 3. /apps/examples/nextjs/auth.ts - Configuration
```

**Day 3-4: Implementation**
- Create `lib/server/auth/refresh.ts` (token refresh logic)
- Create `app/api/auth/refresh/route.ts` (refresh endpoint)
- Add `useTokenRefresh()` hook in `lib/client/hooks/`
- Test with Playwright E2E tests

**Day 5: Testing & Documentation**
- Test near-expiry detection (< 15 min)
- Test token rotation with grace period
- Verify no user interruption
- Document refresh flow in AUTH-EXTENSION.md

---

#### **Week 2: Rate Limiting & Security** (Phase 4.3)
**Study First, Then Implement**

**Day 1-2: Research Phase**
```bash
# Study rate limiting patterns
git clone https://github.com/express-rate-limit/express-rate-limit
cd express-rate-limit && npm install && npm test

# Key learnings:
# 1. Sliding window algorithm
# 2. PostgreSQL vs Redis storage
# 3. IP detection from proxy headers
```

**Day 3-5: Implementation**
- Create `login_attempts` table migration
- Create `lib/server/auth/rate-limit.ts` service
- Add CAPTCHA integration (hCaptcha or reCAPTCHA)
- Create email alert templates
- Add unlock mechanism endpoint

**Day 6-7: Testing**
- Test account lockout (5 failures in 15 min)
- Test IP throttling (10 failures per hour)
- Test CAPTCHA trigger (after 3 failures)
- Load test with 10k req/min

---

#### **Week 3: Admin Dashboard** (Phase 4.2)
**Study First, Then Implement**

**Day 1-2: Research Phase**
```bash
# Study admin dashboard patterns
git clone https://github.com/ixartz/SaaS-Boilerplate
cd SaaS-Boilerplate && pnpm install && pnpm dev

# Study:
# 1. /src/features/audit-logs - Audit viewer
# 2. /src/features/organizations - Multi-tenancy UI
# 3. /src/components/DataTable.tsx - Table component
```

**Day 3-5: Implementation**
- Create `app/(app)/admin/logs/page.tsx`
- Create `app/api/admin/audit-logs/route.ts`
- Add filters (user, action, date, IP)
- Implement CSV export with streaming
- Add admin role guard middleware

**Day 6-7: Optimization**
- Test query performance with 100k records (<500ms)
- Add pagination (50 items per page)
- Test CSV export with 10k records (<10s)
- Add real-time feed (optional)

---

### 📊 Code Quality Checklist

**Before Starting Each Phase**:
- [ ] Read reference project code (2-3 hours)
- [ ] Clone and run examples locally
- [ ] Document key patterns in notes
- [ ] Create proof-of-concept in separate branch

**During Implementation**:
- [ ] Follow TypeScript strict mode
- [ ] Use Zod for runtime validation
- [ ] Add proper error handling (HttpError)
- [ ] Use standardized logger (no console.log)
- [ ] Follow constants pattern (no magic strings)

**After Implementation**:
- [ ] Write unit tests (Vitest)
- [ ] Write integration tests (Playwright)
- [ ] Run `pnpm typecheck` (0 errors)
- [ ] Update documentation (AUTH-EXTENSION.md)
- [ ] Create PR with proper description

---

### 🎯 Success Validation

**Phase 3.3 Validation**:
```bash
# Manual testing
1. Login and wait 20 minutes (should auto-refresh)
2. Check Network tab for refresh calls
3. Verify no logout/redirect
4. Test token rotation (old token invalid)

# Automated testing
pnpm test:e2e -- --grep "session refresh"
```

**Phase 4.3 Validation**:
```bash
# Manual testing
1. Try 5 failed logins in 15 minutes
2. Verify account locked
3. Check email for alert
4. Test unlock via email link

# Load testing
pnpm test:load -- --target 10000 --duration 60s
```

**Phase 4.2 Validation**:
```bash
# Query performance
1. Seed 100k audit log records
2. Run complex filter query
3. Verify <500ms response time
4. Export 10k records to CSV
5. Verify <10s download time
```

---

## 8. Recommended Implementation Order

### Phase A: Critical Security (Weeks 1-2)
**Goal**: Production-ready security baseline

1. ✅ ~~Phase 3.3 - Session Refresh~~ (Priority 1)
   - Token expiry detection
   - Refresh endpoint
   - Client-side hook
   - Token rotation

2. ✅ ~~Phase 4.3 - Failed Login Protection~~ (Priority 2)
   - Login attempts table
   - Rate limiting middleware
   - CAPTCHA integration
   - Email alerts
   - Unlock mechanism

### Phase B: Operational Visibility (Week 3)
**Goal**: Enable monitoring and debugging

3. ✅ ~~Phase 4.2 - Admin Dashboard~~ (Priority 3)
   - Audit log viewer
   - Filters and search
   - CSV export
   - Admin role guard

4. ✅ ~~Phase 4.4 - Health Monitoring~~ (Priority 4)
   - Health check endpoints
   - JWKS monitoring
   - Session metrics
   - Alerting setup

### Phase C: Advanced Features (Weeks 4-6)
**Goal**: Competitive advantage

5. ⏳ Phase 5.1 - Two-Factor Authentication (Optional)
   - TOTP secrets
   - QR code enrollment
   - Recovery codes
   - Backup flow

6. ⏳ Phase 5.2 - Passwordless Login (Optional)
   - Magic links
   - Email flow
   - Auto-login

7. ⏳ Phase 5.3 - WebAuthn/Passkeys (Future)
   - Credential registration
   - Authentication flow
   - Device management

---

## 8. Risk Assessment

### High-Risk Gaps
1. **No Session Refresh** ⚠️
   - Users will be logged out unexpectedly
   - Poor UX, lost work, support tickets
   - **Mitigation**: Implement Phase 3.3 immediately

2. **No Rate Limiting** ⚠️
   - Vulnerable to brute force attacks
   - Credential stuffing risk
   - Account takeover potential
   - **Mitigation**: Implement Phase 4.3 before public launch

### Medium-Risk Gaps
3. **No Admin Dashboard** ⚠️
   - Cannot investigate security incidents
   - No visibility into suspicious activity
   - **Mitigation**: Implement Phase 4.2 within 1 month

4. **No Health Monitoring** ⚠️
   - Silent failures not detected
   - JWKS downtime unnoticed
   - **Mitigation**: Implement Phase 4.4 before scale

### Low-Risk Gaps
5. **No 2FA** ℹ️
   - Acceptable for MVP
   - Can add later based on user demand
   - **Mitigation**: Document in roadmap

---

## 9. Success Metrics

### Phase 3.3 (Session Refresh)
- ✅ Token refresh success rate >99%
- ✅ No user-reported "unexpected logout" issues
- ✅ Average token lifetime: 24 hours (extended via refresh)

### Phase 4.3 (Failed Login Protection)
- ✅ Brute force attempts blocked: 100%
- ✅ False positive lockout rate: <1%
- ✅ Account unlock time: <2 minutes (via email)

### Phase 4.2 (Admin Dashboard)
- ✅ Audit log query time: <500ms for 100k records
- ✅ CSV export generation: <10 seconds for 10k records
- ✅ Admin adoption rate: 100% of team uses dashboard

### Phase 4.4 (Health Monitoring)
- ✅ JWKS downtime detection: <2 minutes
- ✅ Alert response time: <5 minutes
- ✅ False alert rate: <5%

---

## 10. Next Immediate Actions

### Option A: Security-First (Recommended)
**Priority**: Eliminate high-risk gaps before launch

1. **Implement Phase 3.3 - Session Refresh** (2-3 days)
   - Create refresh endpoint
   - Add client hook
   - Test rotation logic

2. **Implement Phase 4.3 - Failed Login Protection** (4-5 days)
   - Create login_attempts table
   - Add rate limiting
   - Integrate CAPTCHA
   - Email alerts

3. **Test & Deploy** (2 days)
   - Integration tests
   - Security testing
   - Production deployment

**Timeline**: ~2 weeks to production-ready

---

### Option B: Visibility-First (Alternative)
**Priority**: Enable monitoring, defer advanced security

1. **Implement Phase 4.2 - Admin Dashboard** (3-4 days)
   - Audit log viewer
   - Filters
   - CSV export

2. **Implement Phase 4.4 - Health Monitoring** (2-3 days)
   - Health checks
   - Metrics
   - Alerts

3. **Implement Phase 3.3 - Session Refresh** (2-3 days)

4. **Implement Phase 4.3 - Rate Limiting** (4-5 days)

**Timeline**: ~3 weeks to full feature set

---

## Conclusion

**Current State**: ✅ Solid foundation with 7/12 phases complete  
**Biggest Gap**: ⚠️ Session refresh and rate limiting (critical for production)  
**Recommended Path**: Security-First (Option A) for fastest path to production  
**Estimated Effort**: 2-3 weeks for critical features, 4-6 weeks for full feature set  

**Decision Point**: Choose between Option A (fast, secure launch) or Option B (full visibility, slower launch).

---

## 📚 Reference Project Summary

### **Best Matches for Your Stack**
1. **Relivator** - Drizzle + Neon + Next.js 15 (EXACT MATCH)
2. **Stack Auth** - Session management + Admin dashboard
3. **NextJS SessionAuth Template** - Session-based auth with Drizzle

### **Phase-Specific References**
- **Phase 3.3**: NextAuth.js → `/packages/core/src/lib/session.ts`
- **Phase 4.2**: SaaS-Boilerplate → `/src/features/audit-logs`
- **Phase 4.3**: Express-Rate-Limit → `/source/lib.ts`
- **Phase 4.4**: Stack Auth → Health monitoring patterns

### **Learning Strategy**
1. Clone and run reference projects locally
2. Study specific code patterns for each phase
3. Implement with proper type safety and error handling
4. Test thoroughly (unit + integration + E2E)
5. Document learnings and update this file

### **Quality Benchmarks**
- **Code Quality**: Follow NextAuth.js error handling patterns
- **Type Safety**: Follow Stack Auth Zod validation patterns
- **Performance**: Follow Refine.dev table optimization patterns
- **Security**: Follow Express-Rate-Limit sliding window patterns

---

**Document Maintainer**: GitHub Copilot  
**Next Review**: After Phase 3.3 implementation  
**Contact**: Update this document after each phase completion  
**Reference Projects**: See "Open Source Learning Resources" section for links
