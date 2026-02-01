# NEON Infrastructure & Database Schema

## Project Overview

**Project Name:** nexuscanon-axis  
**Project ID:** `dark-band-87285012`  
**Hosted On:** [Neon.tech](https://neon.tech) - Serverless PostgreSQL  
**Production Branch:** `production` (br-icy-darkness-a1eom4rq)  
**Database:** `neondb`  
**Compute:** Auto-scaling 0.25-2 CU (vCPU)  

---

## Database Schemas

### 1. **drizzle** Schema
Manages database migrations using Drizzle ORM.

- `__drizzle_migrations` (TABLE)
  - Tracks all applied database migrations
  - Ensures schema consistency across deployments

### 2. **neon_auth** Schema
Manages authentication and user management via Better Auth SDK.

#### Core Tables:
- **user** - User accounts
  - Primary key: `id` (UUID)
  - Unique index: `email`
  
- **account** - OAuth/credential providers
  - Stores Google, GitHub OAuth connections
  - Foreign key: `userId`
  
- **session** - Active user sessions
  - Token-based authentication
  - Indexed by: `userId`, `token`
  
- **verification** - Email verification and OTP
  - Identifier index for fast lookup
  
- **jwks** - JWT Key Set
  - Stores signing keys for JWT validation
  
- **organization** - Multi-tenant support
  - Unique slug index for URL routing
  
- **member** - Organization memberships
  - Links users to organizations
  - Indexed by: `userId`, `organizationId`
  
- **invitation** - Pending invitations
  - Email and organization indexed

### 3. **public** Schema
Application-specific data and business logic.

#### Authentication & User Management:
- **accounts** - Legacy account records
- **sessions** - Session tracking
- **password_reset_tokens** - Password reset flow
- **verification_tokens** - Email verification tokens
- **user_activity_log** - Audit trail

#### Business Data:
- **users** - Extended user profiles
- **projects** - Project workspace
- **tasks** - Task/workflow items
- **task_history** - Task change audit trail
- **recurrence_rules** - Recurring task scheduling
- **tenant_design_system** - UI/UX theming per tenant

---

## Security & Compliance

### NEON Security Features

✅ **Encryption in Transit**
- TLS 1.3 for all connections
- Connection pooling via `-pooler` suffix endpoints

✅ **Encryption at Rest**
- PostgreSQL WAL encryption
- Encrypted backups

✅ **SOC 2 Type II Compliance**
- Security, availability, processing integrity, confidentiality, privacy controls
- Annual audits by independent auditors
- [Neon SOC 2 Attestation](https://neon.tech/security/compliance)

✅ **HIPAA Compliance**
- Business Associate Agreement (BAA) available
- Encryption and access controls meet HIPAA requirements
- Audit logging for compliance

✅ **GDPR Compliant**
- Data residency options (AWS regions)
- Right to deletion supported
- Data processing agreements available

### Application Security

1. **Better Auth (OAuth 2.0)**
   - Google OAuth integration
   - GitHub OAuth integration
   - JWT-based session management
   - Automatic JWKS validation

2. **Environment Variables (Zero-Knowledge)**
   - Secrets stored in `.env` (local dev only)
   - Production secrets in secure environment
   - Never committed to source control

3. **Connection Pooling**
   - Uses Neon pooler: `ep-fancy-wildflower-a1o82bpk-pooler.ap-southeast-1.aws.neon.tech`
   - Handles 1000+ concurrent connections
   - Connection timeout: 4 hours (pooler)

---

## Database Structure & Indexing Strategy

### Performance Optimization

**Indexed Columns:**
```
neon_auth.user
├── user.email (UNIQUE)
└── user.id (PRIMARY KEY)

neon_auth.account
├── account.userId (FOREIGN KEY)
└── account.id (PRIMARY KEY)

neon_auth.session
├── session.userId (INDEX)
├── session.token (UNIQUE)
└── session.id (PRIMARY KEY)

neon_auth.organization
├── organization.slug (UNIQUE INDEX)
└── organization.id (PRIMARY KEY)

public.users
├── users.id (PRIMARY KEY)
└── users.email (INDEX)

public.tasks
├── tasks.id (PRIMARY KEY)
└── tasks.project_id (INDEX)
```

### Storage Metrics

- **Logical Size:** ~32.2 MB
- **Written Data:** ~511 KB (current session)
- **Data Transfer:** ~1.5 MB (current session)
- **Growth Rate:** Scales automatically

---

## Neon-Specific Configurations

### Connection String

```bash
DATABASE_URL=postgresql://neondb_owner:${PASSWORD}@ep-fancy-wildflower-a1o82bpk-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Components:**
- `neondb_owner` - Default role
- `ep-fancy-wildflower-a1o82bpk-pooler` - Connection pooler endpoint
- `ap-southeast-1` - AWS region (Asia Pacific - Singapore)
- `sslmode=require` - Mandatory TLS
- `channel_binding=require` - Channel binding for SCRAM-SHA-256

### Auto-Scaling Configuration

- **Min Compute:** 0.25 CU (~0.5 vCPU)
- **Max Compute:** 2 CU (~4 vCPU)
- **Autosuspend:** Scales down when idle
- **Cost:** Pay-as-you-use model

### Backup Strategy

- **Automatic Backups:** Every hour
- **Retention:** 7 days (configurable)
- **PITR:** Point-in-Time Recovery available
- **WAL Archival:** Continuous replication

---

## Neon Auth Configuration

### OAuth Providers Configured

#### Google OAuth
- **Provider:** Google Cloud Console
- **Client ID:** `510858436388-r68bil6v9v8sjl6mh3aphj​ura1tqqbb.apps.googleusercontent.com`
- **Callback URL:** `https://ep-fancy-wildflower-a1o82bpk.neonauth.ap-southeast-1.aws.neon.tech/neondb/auth/callback/google`
- **Scopes:** email, profile

#### GitHub OAuth
- **Provider:** GitHub OAuth Apps
- **Client ID:** `Ov23liiyFaRb6wfKOf4Q`
- **Callback URL:** `https://ep-fancy-wildflower-a1o82bpk.neonauth.ap-southeast-1.aws.neon.tech/neondb/auth/callback/github`
- **Scopes:** user:email

### JWT Configuration

- **JWKS URL:** `https://ep-fancy-wildflower-a1o82bpk.neonauth.ap-southeast-1.aws.neon.tech/neondb/auth/.well-known/jwks.json`
- **Algorithm:** RS256 (RSA SHA-256)
- **Key Rotation:** Automatic
- **Validation:** Performed by Data API

---

## Data Retention & Compliance

### Audit Trail

The `public.user_activity_log` table maintains compliance records:
- User actions
- Data access timestamps
- Source IP/user agent
- Searchable and queryable

### Task History

`public.task_history` provides:
- Task state transitions
- Change timestamps
- User attribution
- Compliance reporting

### Session Management

- Auto-expiry after inactivity
- Token rotation support
- Multi-device tracking
- Logout across all sessions

---

## Migration & Deployment

### Drizzle ORM Integration

- **Migrations Path:** `drizzle/`
- **Configuration:** `drizzle.config.ts`
- **Driver:** neon-http (serverless)
- **Execution:** Pre-deployment in CI/CD

### Zero-Downtime Migrations

Neon supports:
- Online schema changes (PostgreSQL 15+)
- Non-blocking index creation
- Constraints validation without locks

### Deployment Process

1. **Development Branch:** New migrations tested locally
2. **Preview Branch:** Database snapshot for testing
3. **Production Branch:** Migrations applied before application release
4. **Rollback:** PITR available if needed

---

## Monitoring & Observability

### Neon Console Metrics

- CPU usage tracking
- Connection count monitoring
- Storage growth visualization
- Query performance insights
- Data transfer analytics

### Application Logging

- Structured logging to Grafana (OTEL)
- Sentry error tracking
- Request/response logging
- Authentication audit trail

### Slow Query Detection

Neon identifies:
- Queries > 5 seconds
- N+1 query patterns
- Full table scans
- Missing indexes

---

## Best Practices

### Connection Management

✅ Always use connection pooler for applications  
✅ Set connection timeout to 4 hours  
✅ Reuse connections in serverless functions  
✅ Close idle connections  

### Security

✅ Rotate passwords quarterly  
✅ Use separate roles for read/write/admin  
✅ Enable Row-Level Security (RLS) for multi-tenant  
✅ Encrypt sensitive PII in application layer  

### Performance

✅ Index foreign keys  
✅ Partition large tables  
✅ Use EXPLAIN ANALYZE for tuning  
✅ Cache frequently accessed data  

### Cost Optimization

✅ Enable autosuspend for dev branches  
✅ Scale to zero after working hours  
✅ Archive old data to object storage  
✅ Use computed columns for aggregations  

---

## Resource Links

- 📚 [Neon Documentation](https://neon.tech/docs)
- 🔐 [Neon Security Whitepaper](https://neon.tech/security)
- 📋 [SOC 2 Compliance](https://neon.tech/security/compliance)
- ✅ [HIPAA Compliance](https://neon.tech/security/hipaa)
- 🚀 [Performance Guide](https://neon.tech/docs/guides/performance-best-practices)
- 🛡️ [Authentication Guide](https://neon.tech/docs/guides/authentication)
- 📊 [Monitoring Guide](https://neon.tech/docs/guides/observability)

---

**Last Updated:** February 1, 2026  
**Maintained By:** AFENDA Development Team
