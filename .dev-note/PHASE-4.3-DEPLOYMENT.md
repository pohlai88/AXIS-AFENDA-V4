# Phase 4.3 Deployment Checklist

> **Status**: Code Complete ✅ | **Date**: February 1, 2026  
> **Priority**: 🔴 CRITICAL - Blocks Production

## ✅ Completed Tasks

### 1. Implementation (100%)
- [x] Database schema (`login_attempts` table with indexes)
- [x] Rate limiter service with sliding window algorithm
- [x] CAPTCHA integration (hCaptcha server + client)
- [x] Unlock mechanism (user + admin endpoints)
- [x] Email alerts (suspicious login template)
- [x] Login endpoint integration
- [x] Audit logging (account_locked/unlocked events)

### 2. Testing (100%)
- [x] Unit tests created (`tests/unit/rate-limit.test.ts`)
- [x] Integration tests created (`tests/integration/login-protection.test.ts`)
- [x] E2E tests created (`tests/e2e/brute-force.spec.ts`)

### 3. Documentation (100%)
- [x] AUTH-EXTENSION.md updated
- [x] AUTH-GAP-ANALYSIS.md updated (Critical Security: 100%)
- [x] Implementation details documented

## ⏳ Deployment Steps

### Step 1: Environment Configuration

Add these environment variables to your `.env` file:

```env
# CAPTCHA Configuration (hCaptcha Test Keys - Replace in Production)
CAPTCHA_SECRET_KEY=0x0000000000000000000000000000000000000000
CAPTCHA_PROVIDER=hcaptcha
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001

# Production Keys (Get from https://dashboard.hcaptcha.com/)
# CAPTCHA_SECRET_KEY=your-production-secret-key
# NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-production-site-key
```

**Test Keys Info**:
- These are official hCaptcha test keys
- Always pass verification in test environment
- Replace with production keys before deploying

### Step 2: Database Migration

The database schema needs to be updated. There are two approaches:

#### Option A: Manual SQL (Recommended for existing databases)

Run this SQL directly in your Neon database console:

```sql
-- Create login_attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,
  attempts INTEGER DEFAULT 1 NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS login_attempts_identifier_idx 
  ON login_attempts(identifier);
  
CREATE INDEX IF NOT EXISTS login_attempts_locked_idx 
  ON login_attempts(locked_until) 
  WHERE locked_until IS NOT NULL;
```

Verification:
```sql
-- Check table was created
\d login_attempts

-- Check indexes exist
\di login_attempts*
```

#### Option B: Drizzle Migration (For clean databases)

⚠️ **NOTE**: There's a schema conflict with existing migrations. The generated migration file (`0002_far_praxagora.sql`) includes other tables that may already exist.

If you have a clean database:
```bash
pnpm drizzle-kit push
```

If you encounter errors, use Option A (Manual SQL) instead.

### Step 3: Install Dependencies

hCaptcha React component should already be installed:
```bash
pnpm list @hcaptcha/react-hcaptcha
```

If not installed:
```bash
pnpm add @hcaptcha/react-hcaptcha
```

### Step 4: Run Tests

```bash
# Unit tests
pnpm test tests/unit/rate-limit.test.ts

# Integration tests (requires database connection)
pnpm test tests/integration/login-protection.test.ts

# E2E tests (requires dev server running)
pnpm test:e2e tests/e2e/brute-force.spec.ts
```

### Step 5: Verify Implementation

1. **Start dev server**:
   ```bash
   pnpm dev
   ```

2. **Test failed login flow**:
   - Navigate to http://localhost:3000/login
   - Attempt login with wrong password 3 times
   - Verify CAPTCHA appears on 4th attempt
   - Continue to 5th failed attempt
   - Verify account locked message
   - Check email for unlock link (if Resend configured)

3. **Test unlock flow**:
   - Click unlock link from email OR
   - Use admin unlock endpoint OR
   - Wait 15 minutes for auto-unlock

4. **Check database**:
   ```sql
   SELECT * FROM login_attempts WHERE identifier = 'your-test-email@example.com';
   SELECT * FROM user_activity_log WHERE action IN ('account_locked', 'account_unlocked');
   ```

## 🔒 Security Checklist

- [ ] Production CAPTCHA keys configured (replace test keys)
- [ ] Environment variables secured (not in git)
- [ ] Database indexes created and verified
- [ ] Unlock token expiry tested (1 hour)
- [ ] Timing-safe comparison working
- [ ] IP extraction from X-Forwarded-For header working
- [ ] Audit logging capturing lock/unlock events

## 📊 Monitoring & Metrics

Once deployed, monitor these metrics:

1. **Rate Limiting Effectiveness**:
   - Failed login attempts blocked
   - Accounts locked per day
   - CAPTCHA challenges served
   - False positive lockouts (< 1%)

2. **Performance**:
   - Rate limit check time (< 50ms)
   - Database query performance
   - Login endpoint latency

3. **User Impact**:
   - Unlock requests per day
   - Average time to unlock
   - Support tickets related to lockouts

## 🚨 Troubleshooting

### CAPTCHA Not Showing
- Check `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` is set
- Verify 3 failed attempts recorded in database
- Check browser console for hCaptcha errors

### Account Not Locking
- Verify `login_attempts` table exists
- Check rate limiter is called in auth endpoint
- Verify `RATE_LIMIT_EMAIL_LOCKOUT_THRESHOLD=5` constant

### Unlock Link Not Working
- Check `verificationTokens` table for unlock token
- Verify token not expired (< 1 hour old)
- Check timing-safe comparison in `verifyUnlockToken()`

### Database Errors
- Ensure indexes created: `\di login_attempts*`
- Check connection string in `.env`
- Verify Neon database accessible

## 📈 Success Criteria

Phase 4.3 is production-ready when:

- ✅ All unit tests passing
- ✅ All integration tests passing
- ✅ Manual testing completed successfully
- ✅ Production environment variables configured
- ✅ Database migration applied
- ✅ Zero TypeScript errors
- ✅ Security audit passed
- ✅ Performance benchmarks met (< 50ms rate limit check)

## 🎯 Next Steps (Post-Deployment)

After successful deployment of Phase 4.3:

1. **Monitor for 48 hours**
   - Watch for false positives
   - Check CAPTCHA solve rates
   - Monitor unlock request patterns

2. **Start Phase 4.2 - Admin Dashboard**
   - Build audit log viewer
   - Add user search and filters
   - Implement CSV export

3. **Start Phase 4.4 - Health Monitoring**
   - JWKS endpoint monitoring
   - Failed login alerting
   - Session metrics dashboard

---

**Deployment Owner**: [Your Name]  
**Review Date**: [Current Date]  
**Sign-off**: [ ] Dev [ ] QA [ ] Security [ ] Product
