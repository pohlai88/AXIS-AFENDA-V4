#!/usr/bin/env node

/**
 * Validate Neon Auth Developer Credentials
 * 
 * This script validates that all required Neon Auth environment variables
 * are properly configured for development.
 * 
 * Usage:
 *   node scripts/validate-neon-auth-credentials.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function separator() {
  log('─'.repeat(80), 'gray')
}

function success(message) {
  log(`✅ ${message}`, 'green')
}

function error(message) {
  log(`❌ ${message}`, 'red')
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue')
}

function header(message) {
  separator()
  log(message, 'cyan')
  separator()
}

// Load environment variables
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const env = {}

  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return

    const [key, ...valueParts] = trimmed.split('=')
    if (key) {
      env[key] = valueParts.join('=').replace(/^["']|["']$/g, '')
    }
  })

  return env
}

// Required variables for Neon Auth
const REQUIRED_VARS = {
  DATABASE_URL: {
    description: 'PostgreSQL connection string',
    pattern: /^postgresql:\/\//,
  },
  NEON_PROJECT_ID: {
    description: 'Neon project ID',
  },
  NEON_AUTH_BASE_URL: {
    description: 'Neon Auth base URL',
    pattern: /^https:\/\/.*\.neonauth\..+\/neondb\/auth$/,
  },
  JWKS_URL: {
    description: 'JWT Key Set URL for token validation',
    pattern: /^https:\/\/.*\.neonauth\..+\/neondb\/auth\/\.well-known\/jwks\.json$/,
  },
  NEON_DATA_API_URL: {
    description: 'Neon Data API URL',
    pattern: /^https:\/\/.*\.apirest\..+\/neondb\/rest\/v1$/,
  },
}

const OPTIONAL_VARS = {
  NEON_JWT_SECRET: {
    description: 'JWT secret for token signing (auto-generated if not provided)',
  },
  NEON_AUTH_COOKIE_SECRET: {
    description: 'Cookie secret for session management',
  },
  NEON_API_KEY: {
    description: 'Neon API key for CLI operations',
  },
}

const OAUTH_VARS = {
  GOOGLE_CLIENT_ID: {
    description: 'Google OAuth 2.0 Client ID',
  },
  GOOGLE_CLIENT_SECRET: {
    description: 'Google OAuth 2.0 Client Secret',
  },
  GITHUB_ID: {
    description: 'GitHub OAuth App ID',
  },
  GITHUB_SECRET: {
    description: 'GitHub OAuth App Secret',
  },
}

// Validate URL pattern
function validateUrl(url, pattern) {
  if (!url) return false
  return pattern ? pattern.test(url) : /^https?:\/\//.test(url)
}

// Validate database connection string
async function validateDatabaseConnection(dbUrl) {
  try {
    const { Pool } = await import('pg')
    const pool = new Pool({ connectionString: dbUrl })
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()
    await pool.end()
    return true
  } catch (error) {
    console.error('Database connection error:', error.message)
    return false
  }
}

// Validate JWKS endpoint
async function validateJwksUrl(jwksUrl) {
  try {
    const response = await fetch(jwksUrl, {
      headers: {
        'User-Agent': 'neon-auth-validator/1.0',
      },
      timeout: 5000,
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.keys && Array.isArray(data.keys) && data.keys.length > 0
  } catch (error) {
    return false
  }
}

// Validate Neon Auth endpoints
async function validateNeonAuthEndpoints(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`, {
      headers: {
        'User-Agent': 'neon-auth-validator/1.0',
      },
      timeout: 5000,
    })

    return response.ok
  } catch (error) {
    return false
  }
}

// Main validation function
async function validateNeonAuthCredentials() {
  const envPath = path.join(projectRoot, '.env.local')
  const env = loadEnv(envPath)

  header('NEON AUTH DEVELOPER CREDENTIALS VALIDATION')

  let allValid = true
  const results = {
    required: { valid: [], invalid: [], missing: [] },
    optional: { valid: [], configured: [], missing: [] },
    oauth: { valid: [], configured: [], missing: [] },
    endpoints: { valid: [], invalid: [] },
  }

  // Validate required variables
  log('\n📋 Checking Required Variables:', 'cyan')
  separator()

  for (const [key, config] of Object.entries(REQUIRED_VARS)) {
    const value = env[key]

    if (!value) {
      error(`${key} - NOT SET`)
      results.required.missing.push(key)
      allValid = false
    } else if (config.pattern && !validateUrl(value, config.pattern)) {
      warning(`${key} - INVALID FORMAT`)
      console.log(`   Expected pattern: ${config.pattern}`)
      console.log(`   Got: ${value.substring(0, 80)}...`)
      results.required.invalid.push(key)
      allValid = false
    } else {
      success(`${key} - ${config.description}`)
      results.required.valid.push(key)
    }
  }

  // Validate optional variables
  log('\n⚙️  Checking Optional Variables:', 'cyan')
  separator()

  for (const [key, config] of Object.entries(OPTIONAL_VARS)) {
    const value = env[key]

    if (value) {
      success(`${key} - Configured`)
      results.optional.configured.push(key)
    } else {
      info(`${key} - Not configured (optional)`)
      results.optional.missing.push(key)
    }
  }

  // Validate OAuth configuration
  log('\n🔐 Checking OAuth Configuration:', 'cyan')
  separator()

  const configuredOAuth = []
  const missingOAuth = []

  for (const [key, config] of Object.entries(OAUTH_VARS)) {
    const value = env[key]

    if (value) {
      // Show only first/last few characters for secrets
      const masked =
        key.includes('SECRET') || key.includes('PRIVATE')
          ? value.substring(0, 4) + '...' + value.substring(value.length - 4)
          : value.substring(0, 20) + '...'

      success(`${key} - ${masked}`)
      configuredOAuth.push(key)
      results.oauth.configured.push(key)
    } else {
      warning(`${key} - Not configured`)
      results.oauth.missing.push(key)
    }
  }

  // Validate endpoints (async operations)
  if (env.JWKS_URL || env.NEON_AUTH_BASE_URL) {
    log('\n🌐 Checking Endpoint Accessibility:', 'cyan')
    separator()

    if (env.JWKS_URL) {
      info('Validating JWKS endpoint...')
      const jwksValid = await validateJwksUrl(env.JWKS_URL)
      if (jwksValid) {
        success('JWKS endpoint is accessible and valid')
        results.endpoints.valid.push('JWKS_URL')
      } else {
        warning(
          'JWKS endpoint validation failed - may be offline or require authentication'
        )
        results.endpoints.invalid.push('JWKS_URL')
      }
    }

    if (env.NEON_AUTH_BASE_URL) {
      info('Validating Neon Auth endpoint...')
      const authValid = await validateNeonAuthEndpoints(env.NEON_AUTH_BASE_URL)
      if (authValid) {
        success('Neon Auth endpoint is accessible')
        results.endpoints.valid.push('NEON_AUTH_BASE_URL')
      } else {
        warning(
          'Neon Auth endpoint validation failed - may be offline or require authentication'
        )
        results.endpoints.invalid.push('NEON_AUTH_BASE_URL')
      }
    }
  }

  // Summary
  log('\n📊 VALIDATION SUMMARY:', 'cyan')
  separator()

  const requiredAllValid = results.required.missing.length === 0 && results.required.invalid.length === 0
  const oauthConfigured = results.oauth.configured.length > 0

  if (requiredAllValid) {
    success('All required Neon Auth variables are configured correctly')
  } else {
    error(
      `Missing or invalid required variables: ${results.required.missing.length + results.required.invalid.length}`
    )
  }

  if (oauthConfigured) {
    success(`OAuth configured: ${results.oauth.configured.length} provider(s)`)
  } else {
    warning('No OAuth providers configured - authentication may not work')
  }

  if (results.optional.configured.length > 0) {
    success(`${results.optional.configured.length} optional variables configured`)
  }

  // Detailed missing variables
  if (results.required.missing.length > 0) {
    log('\n❌ Missing Required Variables:', 'red')
    results.required.missing.forEach((key) => {
      const config = REQUIRED_VARS[key]
      console.log(`   • ${key}: ${config.description}`)
    })
  }

  if (results.required.invalid.length > 0) {
    log('\n⚠️  Invalid Variable Formats:', 'yellow')
    results.required.invalid.forEach((key) => {
      const config = REQUIRED_VARS[key]
      console.log(`   • ${key}: ${config.description}`)
      if (config.pattern) {
        console.log(`     Expected pattern: ${config.pattern}`)
      }
    })
  }

  if (results.oauth.missing.length > 0) {
    log('\n⚠️  Missing OAuth Variables:', 'yellow')
    results.oauth.missing.forEach((key) => {
      const config = OAUTH_VARS[key]
      console.log(`   • ${key}: ${config.description}`)
    })
  }

  // Final recommendation
  log('\n💡 RECOMMENDATIONS:', 'cyan')
  separator()

  if (!requiredAllValid) {
    error('Please configure all required variables before proceeding')
    console.log('Required variables:')
    Object.entries(REQUIRED_VARS).forEach(([key, config]) => {
      console.log(`  - ${key}: ${config.description}`)
    })
  } else if (!oauthConfigured) {
    warning('OAuth is not fully configured. Configure at least one provider for user authentication.')
  } else {
    success('Neon Auth developer credentials are properly configured!')
    success('You can now run: npm run dev')
  }

  separator()

  process.exit(allValid && requiredAllValid ? 0 : 1)
}

// Run validation
await validateNeonAuthCredentials()
