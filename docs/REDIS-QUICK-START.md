# Redis Implementation Quick Start

**For:** NEXIS-AFENDA-V4  
**Task:** Add Redis caching to subdomain resolution  
**Time:** ~2-4 hours total  
**Outcome:** 4x faster subdomain resolution, 80% database load reduction  

---

## Step 1: Create Upstash Redis Database (10 minutes)

### Option A: Upstash Cloud (Free Tier)

1. Go to **https://upstash.com**
2. Sign up (Google/GitHub OAuth)
3. Click "Create Database" → Select "Redis"
4. Choose:
   - **Region:** `ap-southeast-1` (matches Neon)
   - **Type:** `Free` (10K commands/day)
5. Copy the **REDIS_URL** (looks like: `redis://default:xxxxx@xxxxx.upstash.io:xxxxx`)

### Option B: Vercel KV (Even Easier)

1. Go to **https://vercel.com/dashboard**
2. Select your project → Settings → Storage
3. Click "Create" → Select "KV"
4. Vercel auto-integrates with your project
5. Copy the `KV_REST_API_URL` and `KV_REST_API_TOKEN`

**Choose Upstash** ✅ (more direct Redis client support)

---

## Step 2: Update Environment Variables (5 minutes)

### Add to `.env.local`:

```env
# =============================================================================
# Caching (Upstash Redis)
# =============================================================================
REDIS_URL=redis://default:<password>@<hostname>:<port>
REDIS_SUBDOMAIN_TTL=3600  # 1 hour for subdomain configs
REDIS_ORG_CONFIG_TTL=1800  # 30 min for org settings
REDIS_ENABLED=true
```

### Add to `.env` (git-tracked):

```env
# Caching flags (can be disabled if Redis fails)
REDIS_ENABLED=true
REDIS_SUBDOMAIN_TTL=3600
REDIS_ORG_CONFIG_TTL=1800
```

### Vercel Dashboard:

1. Go to project → Settings → Environment Variables
2. Add `REDIS_URL` with your Upstash connection string
3. Set to all environments (Production, Preview, Development)

---

## Step 3: Install Redis Client (2 minutes)

```bash
pnpm add redis
```

---

## Step 4: Create Redis Utility (15 minutes)

**File:** `lib/server/redis.ts`

```typescript
import { createClient, type RedisClientType } from 'redis'

let redisClient: RedisClientType | null = null
let isConnecting = false

/**
 * Get or create Redis client with connection pooling
 */
export async function getRedisClient(): Promise<RedisClientType | null> {
  if (!process.env.REDIS_URL || !process.env.REDIS_ENABLED) {
    return null
  }

  if (redisClient) {
    return redisClient
  }

  if (isConnecting) {
    // Prevent concurrent connection attempts
    for (let i = 0; i < 50; i++) {
      if (redisClient) return redisClient
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return redisClient
  }

  try {
    isConnecting = true
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        connectTimeout: 5000,
      },
    })

    redisClient.on('error', (err) => {
      console.error('[Redis] Client error:', err.message)
    })

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully')
    })

    redisClient.on('disconnect', () => {
      console.warn('[Redis] Disconnected')
    })

    await redisClient.connect()
    return redisClient
  } catch (error) {
    console.error('[Redis] Failed to connect:', error)
    redisClient = null
    return null
  } finally {
    isConnecting = false
  }
}

/**
 * Generic caching utility with graceful fallback
 * @param key Redis key
 * @param fallback Function to call if cache miss
 * @param ttl Time to live in seconds (default 3600s = 1 hour)
 */
export async function getCached<T>(
  key: string,
  fallback: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  if (!process.env.REDIS_ENABLED) {
    // Caching disabled, use fallback directly
    return fallback()
  }

  const client = await getRedisClient()

  if (!client) {
    // Redis unavailable, gracefully fallback to source of truth
    console.warn(`[Redis] Cache unavailable for key: ${key}, using fallback`)
    return fallback()
  }

  try {
    // Try to get from cache
    const cached = await client.get(key)

    if (cached) {
      console.log(`[Redis] Cache HIT for key: ${key}`)
      return JSON.parse(cached) as T
    }

    console.log(`[Redis] Cache MISS for key: ${key}`)

    // Cache miss, fetch from source
    const data = await fallback()

    // Store in cache
    try {
      await client.setEx(key, ttl, JSON.stringify(data))
    } catch (setError) {
      console.warn(`[Redis] Failed to cache key ${key}:`, setError)
      // Fallback still works, just log and continue
    }

    return data
  } catch (error) {
    console.warn(`[Redis] Cache error for key ${key}, using fallback:`, error)
    // If anything goes wrong with Redis, use the fallback
    return fallback()
  }
}

/**
 * Delete a cache entry
 */
export async function invalidateCache(key: string): Promise<void> {
  const client = await getRedisClient()
  if (!client) return

  try {
    await client.del(key)
    console.log(`[Redis] Invalidated cache: ${key}`)
  } catch (error) {
    console.warn(`[Redis] Failed to invalidate cache ${key}:`, error)
  }
}

/**
 * Delete multiple cache entries with pattern matching
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  const client = await getRedisClient()
  if (!client) return

  try {
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(keys)
      console.log(`[Redis] Invalidated ${keys.length} cache entries matching: ${pattern}`)
    }
  } catch (error) {
    console.warn(`[Redis] Failed to invalidate cache pattern ${pattern}:`, error)
  }
}

/**
 * Clear all caches (use with caution)
 */
export async function clearAllCaches(): Promise<void> {
  const client = await getRedisClient()
  if (!client) return

  try {
    await client.flushDb()
    console.log('[Redis] Cleared all caches')
  } catch (error) {
    console.warn('[Redis] Failed to clear all caches:', error)
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{ keys: number; memory: number } | null> {
  const client = await getRedisClient()
  if (!client) return null

  try {
    const info = await client.info('keyspace')
    const dbMatch = info.match(/db0:keys=(\d+),expires=\d+,avg_ttl=\d+/)
    const keys = dbMatch ? parseInt(dbMatch[1]) : 0

    const memoryInfo = await client.info('memory')
    const memoryMatch = memoryInfo.match(/used_memory:(\d+)/)
    const memory = memoryMatch ? parseInt(memoryMatch[1]) : 0

    return { keys, memory }
  } catch (error) {
    console.warn('[Redis] Failed to get cache stats:', error)
    return null
  }
}
```

---

## Step 5: Update Middleware (20 minutes)

**File:** `proxy.ts` (middleware)

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { getCached, invalidateCache } from '@/lib/server/redis'
import { inferTenantFromHost } from '@/lib/server/tenant' // Your existing function

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Get tenant ID with Redis caching
  const tenantId = await getCached(
    `subdomain:${host}`,
    async () => {
      // Fall back to database query
      return inferTenantFromHost(host)
    },
    parseInt(process.env.REDIS_SUBDOMAIN_TTL || '3600') // 1 hour TTL
  )

  // Attach tenant ID to headers for downstream handlers
  const requestHeaders = new Headers(request.headers)
  if (tenantId) {
    requestHeaders.set('x-tenant-id', tenantId)
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

## Step 6: Update API Routes (15 minutes)

**File:** `app/api/subdomains/route.ts`

```typescript
import { getCached, invalidateCachePattern } from '@/lib/server/redis'

// In POST handler (after successful creation)
export async function POST(req: Request) {
  // ... validation and insert logic ...

  const result = await db.insert(subdomainConfig).values({...}).returning()

  // Invalidate org's subdomain cache when new subdomain created
  await invalidateCachePattern(`subdomain:*-${organizationId}`) // If you use org in key
  // Or simpler approach:
  await invalidateCache(`subdomains:${organizationId}`) // If listing is cached

  return ok(result[0], { status: 201 })
}

// In PATCH handler (after successful update)
export async function PATCH(req: Request) {
  // ... validation and update logic ...

  const result = await db.update(subdomainConfig).set({...}).returning()
  const subdomain = result[0].subdomain

  // Invalidate this specific subdomain's cache
  await invalidateCache(`subdomain:${subdomain}`)

  return ok(result[0])
}

// In DELETE handler (after successful deletion)
export async function DELETE(req: Request) {
  // ... validation and delete logic ...

  const subdomain = config.subdomain

  // Invalidate cache
  await invalidateCache(`subdomain:${subdomain}`)

  return ok({ success: true })
}
```

---

## Step 7: Test Redis Connection (10 minutes)

**File:** `lib/server/redis.test.ts` (or test manually)

```typescript
import { getCached, getRedisClient } from '@/lib/server/redis'

// Quick connection test
export async function testRedisConnection() {
  const client = await getRedisClient()
  
  if (!client) {
    console.log('⚠️ Redis not available (running in fallback mode)')
    return false
  }

  try {
    const result = await client.ping()
    console.log('✅ Redis connected:', result)
    return true
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    return false
  }
}

// Test caching
export async function testCaching() {
  const testKey = 'test:timestamp'
  const timestamp = new Date().toISOString()

  // First call - cache miss
  const result1 = await getCached(
    testKey,
    async () => timestamp,
    60 // 60 seconds TTL
  )
  console.log('First call:', result1)

  // Second call - should be from cache (same timestamp)
  const result2 = await getCached(
    testKey,
    async () => new Date().toISOString(),
    60
  )
  console.log('Second call:', result2)

  if (result1 === result2) {
    console.log('✅ Caching works correctly')
  } else {
    console.log('⚠️ Caching may not be working')
  }
}
```

**Run test:**
```bash
# In your dev environment
node -e "
  import('./lib/server/redis').then(m => m.testRedisConnection())
"
```

---

## Step 8: Performance Verification (10 minutes)

**Test subdomain resolution latency:**

```bash
# Without cache (first request)
curl -w "Time: %{time_total}s\n" \
  -H "Host: tenant1.nexuscanon.com" \
  http://localhost:3000/api/subdomains

# Output: Time: 0.150s (database hit)

# With cache (second request)
curl -w "Time: %{time_total}s\n" \
  -H "Host: tenant1.nexuscanon.com" \
  http://localhost:3000/api/subdomains

# Output: Time: 0.010s (Redis hit) - 15x faster!
```

**Expected results:**
- ✅ First request: ~100-200ms (database hit)
- ✅ Second+ requests: ~5-10ms (Redis cache hit)
- ✅ Fallback works if Redis disabled in .env

---

## Step 9: Deploy to Production (varies)

### Vercel Deployment

```bash
# 1. Add REDIS_URL to Vercel environment
vercel env add REDIS_URL

# 2. Paste your Upstash Redis URL

# 3. Deploy
vercel deploy --prod
```

### Manual Deployment

```bash
# Ensure .env.production has REDIS_URL
# Build and deploy using your normal process
pnpm build
pnpm start
```

---

## Monitoring & Debugging

### Enable Verbose Logging (Development)

```typescript
// In lib/server/redis.ts
const debug = process.env.NODE_ENV === 'development'

if (debug) {
  console.log(`[Redis] Cache HIT for key: ${key}`)
  console.log(`[Redis] Cache MISS for key: ${key}`)
}
```

### Check Redis Stats

```bash
# In your API route or utility
import { getCacheStats } from '@/lib/server/redis'

const stats = await getCacheStats()
console.log('Cache keys:', stats?.keys)
console.log('Memory used:', stats?.memory)
```

### Monitor in Upstash Dashboard

1. Go to **Upstash Dashboard**
2. Select your Redis instance
3. View:
   - Commands (read/write operations)
   - Memory usage
   - Hit/miss ratio (if enabled)
   - Latency metrics

---

## Troubleshooting

### ❌ "Redis connection failed"

**Solution:**
1. Check `REDIS_URL` is correctly set
2. Verify Upstash database is running
3. Test connection: `redis-cli -u $REDIS_URL ping`
4. Check network access (firewall rules)

### ❌ "Stale cache data"

**Solution:**
1. Check TTL values in `.env`
2. Verify invalidation is called after writes
3. Manually clear: `await clearAllCaches()`
4. Check cache keys in Upstash dashboard

### ❌ "Redis slower than database"

**Solution:**
1. Check Redis latency in Upstash dashboard
2. Verify region matches (should be `ap-southeast-1`)
3. Consider upgrading from free tier if overloaded
4. Profile with `redis-benchmark` utility

### ⚠️ "Too many connections"

**Solution:**
1. Redis client pooling prevents this
2. Check for connection leaks in code
3. Monitor with `getRedisClient()` - reuses instance
4. Add connection timeout monitoring

---

## Success Checklist

- [ ] Upstash Redis database created
- [ ] `REDIS_URL` added to .env and Vercel
- [ ] `redis` package installed
- [ ] `lib/server/redis.ts` created
- [ ] Middleware updated with `getCached()`
- [ ] API routes updated with invalidation
- [ ] Performance testing shows 10-15x improvement
- [ ] Fallback mode works (with `REDIS_ENABLED=false`)
- [ ] Deployed to production
- [ ] Monitoring configured in Grafana

---

## Next: Advanced Optimization

Once basic caching is working:

1. **Rate Limiting** - Prevent subdomain enumeration
2. **Audit Logging** - Track all subdomain operations
3. **Cache Warming** - Pre-load hot subdomains
4. **Advanced Patterns** - Cache-aside, write-through
5. **Edge Caching** - Vercel KV for global distribution

See [Redis Optimization Validation](./REDIS-OPTIMIZATION-VALIDATION.md) for details.

---

**Total Implementation Time:** 2-4 hours  
**Expected Improvement:** 4x faster, 80% DB load reduction  
**Ready to start?** Begin with Step 1! ✅
