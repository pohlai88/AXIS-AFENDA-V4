# `lib/config/`

[← Back to `lib/`](../README.md) · [↑ Root README](../../README.md)

## Purpose

Application configuration (brand/site config, feature flags, etc.) with performance optimizations.

- Prefer reading public env via `getPublicEnv()` (not direct `process.env`).

## Contents

### `site.ts` - Site Configuration

Centralized site configuration with performance considerations.

```typescript
import { siteConfig } from '@/lib/config/site'

// Access site configuration
const { name, description, url } = siteConfig

// Use in components
export default function Header() {
  return (
    <header>
      <h1>{siteConfig.name}</h1>
      <p>{siteConfig.description}</p>
    </header>
  )
}
```

### Performance Features

#### Optimized Config Loading

Configuration is loaded once and cached:

```typescript
// Config is cached after first access
const config = getSiteConfig(); // Fast on subsequent calls
```

#### Environment-Aware Configuration

Different configs for different environments:

```typescript
// Development
const devConfig = {
  apiUrl: "http://localhost:3000/api",
  enableDebugMode: true,
};

// Production
const prodConfig = {
  apiUrl: "https://app.example.com/api",
  enableDebugMode: false,
};
```

## Configuration Structure

### Site Configuration

```typescript
export const siteConfig = {
  name: "AFENDA",
  description: "Next.js App Router project",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  links: {
    github: "https://github.com/username/afenda",
    docs: "https://docs.example.com",
  },
  features: {
    analytics: process.env.NEXT_PUBLIC_ANALYTICS === "true",
    feedback: process.env.NEXT_PUBLIC_FEEDBACK === "true",
  },
} as const;
```

### Feature Flags

```typescript
export const featureFlags = {
  newDashboard: process.env.NEXT_PUBLIC_FEATURE_DASHBOARD === "true",
  betaFeatures: process.env.NEXT_PUBLIC_BETA_FEATURES === "true",
  maintenanceMode: process.env.NEXT_PUBLIC_MAINTENANCE === "true",
};
```

## Best Practices

### Configuration Access

1. **Use Public Env Helper**:

   ```typescript
   import { getPublicEnv } from "@/lib/env/public";

   const env = getPublicEnv();
   const apiUrl = env.NEXT_PUBLIC_API_URL;
   ```

2. **Cache Configuration**:

   ```typescript
   // Good: Import once, use everywhere
   import { siteConfig } from "@/lib/config/site";

   // Bad: Access process.env directly
   const url = process.env.NEXT_PUBLIC_URL;
   ```

3. **Type Safety**:

   ```typescript
   // Good: Define types for configuration
   interface SiteConfig {
     name: string
     url: string
     features: {
       analytics: boolean
     }
   }

   export const siteConfig: SiteConfig = { ... }
   ```

### Performance Considerations

1. **Static Configuration**: Keep config static where possible
2. **Lazy Loading**: Load heavy config only when needed
3. **Environment Detection**: Use efficient environment checks

```typescript
// Efficient environment check
const isDev = process.env.NODE_ENV === "development";

// Lazy load heavy config
const getHeavyConfig = () => {
  if (!heavyConfig) {
    heavyConfig = loadHeavyConfiguration();
  }
  return heavyConfig;
};
```

## Usage Examples

### SEO Metadata

```typescript
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
  },
};
```

### Feature Flags

```typescript
import { featureFlags } from '@/lib/config/feature-flags'

export default function BetaFeature() {
  if (!featureFlags.betaFeatures) {
    return null
  }

  return <div>New Beta Feature!</div>
}
```

### Analytics Configuration

```typescript
import { siteConfig } from '@/lib/config/site'

export default function Analytics() {
  if (!siteConfig.features.analytics) {
    return null
  }

  return (
    <Script
      src="https://analytics.example.com/script.js"
      strategy="afterInteractive"
    />
  )
}
```

## Environment Variables

### Required Public Variables

- `NEXT_PUBLIC_SITE_URL` - Site URL
- `NEXT_PUBLIC_API_URL` - API base URL

### Optional Public Variables

- `NEXT_PUBLIC_ANALYTICS` - Enable analytics (true/false)
- `NEXT_PUBLIC_BETA_FEATURES` - Enable beta features (true/false)
- `NEXT_PUBLIC_MAINTENANCE` - Maintenance mode (true/false)

## Testing

### Mock Configuration

```typescript
// __mocks__/lib/config/site.ts
export const siteConfig = {
  name: "Test App",
  description: "Test description",
  url: "http://localhost:3000",
};
```

## Security

1. **No Secrets**: Never store secrets in public config
2. **Validation**: Validate configuration values
3. **Defaults**: Provide safe defaults for all values

```typescript
// Validate configuration
const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: parseInt(process.env.NEXT_PUBLIC_TIMEOUT || "5000"),
  retries: Math.max(0, parseInt(process.env.NEXT_PUBLIC_RETRIES || "3")),
};
```
