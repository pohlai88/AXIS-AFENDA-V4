#!/usr/bin/env node

/**
 * NextAuth Validation Script
 * Validates NextAuth configuration and functionality
 */

import { readFileSync } from 'fs'
import { join } from 'path'

interface ValidationResult {
  success: boolean
  message: string
  details?: unknown
}

class NextAuthValidator {
  private projectRoot: string

  constructor() {
    this.projectRoot = process.cwd()
  }

  validateConfiguration(): ValidationResult {
    try {
      // Check auth.ts exists
      const authPath = join(this.projectRoot, 'auth.ts')
      const authExists = this.fileExists(authPath)
      
      if (!authExists) {
        return {
          success: false,
          message: 'auth.ts file not found'
        }
      }

      // Check API route exists
      const apiRoutePath = join(this.projectRoot, 'app/api/auth/[...nextauth]/route.ts')
      const apiRouteExists = this.fileExists(apiRoutePath)
      
      if (!apiRouteExists) {
        return {
          success: false,
          message: 'NextAuth API route not found'
        }
      }

      // Check auth context exists
      const contextPath = join(this.projectRoot, 'lib/server/auth/context.ts')
      const contextExists = this.fileExists(contextPath)
      
      if (!contextExists) {
        return {
          success: false,
          message: 'Auth context not found'
        }
      }

      return {
        success: true,
        message: 'All required files exist',
        details: {
          authFile: authPath,
          apiRoute: apiRoutePath,
          context: contextPath
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  validateDependencies(): ValidationResult {
    try {
      const packageJsonPath = join(this.projectRoot, 'package.json')
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
      
      const nextAuthVersion = packageJson.dependencies?.['next-auth']
      
      if (!nextAuthVersion) {
        return {
          success: false,
          message: 'next-auth dependency not found'
        }
      }

      return {
        success: true,
        message: `NextAuth version ${nextAuthVersion} found`,
        details: {
          version: nextAuthVersion,
          isLatest: this.isLatestVersion(nextAuthVersion)
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Dependency validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  validateEnvironmentVariables(): ValidationResult {
    const requiredVars = [
      'NEXTAUTH_SECRET',
      'AUTH_SECRET',
      'SESSION_SECRET'
    ]

    const optionalVars = [
      'ENABLE_DEV_CREDENTIALS',
      'DEV_AUTH_USERNAME',
      'DEV_AUTH_PASSWORD'
    ]

    const present: string[] = []
    const missing: string[] = []

    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        present.push(varName)
      } else {
        missing.push(varName)
      }
    })

    optionalVars.forEach(varName => {
      if (process.env[varName]) {
        present.push(varName)
      }
    })

    return {
      success: missing.length === 0,
      message: missing.length === 0 
        ? 'All required environment variables present'
        : `Missing required variables: ${missing.join(', ')}`,
      details: {
        present,
        missing,
        optional: optionalVars.filter(v => process.env[v])
      }
    }
  }

  validateAuthConfiguration(): ValidationResult {
    try {
      const authPath = join(this.projectRoot, 'auth.ts')
      const authContent = readFileSync(authPath, 'utf8')

      // Check for key components
      const checks = {
        hasSecret: authContent.includes('getAuthSecret()'),
        hasProviders: authContent.includes('providers: ['),
        hasCallbacks: authContent.includes('callbacks: {'),
        hasCredentialsProvider: authContent.includes('Credentials({'),
        hasJwtCallback: authContent.includes('async jwt({'),
        hasSessionCallback: authContent.includes('async session({'),
        hasTypeDeclarations: authContent.includes('declare module "next-auth"')
      }

      const passedChecks = Object.values(checks).filter(Boolean).length
      const totalChecks = Object.keys(checks).length

      return {
        success: passedChecks === totalChecks,
        message: `Auth configuration validation: ${passedChecks}/${totalChecks} checks passed`,
        details: checks
      }
    } catch (error) {
      return {
        success: false,
        message: `Auth configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  validateApiRoutes(): ValidationResult {
    try {
      const apiRoutePath = join(this.projectRoot, 'app/api/auth/[...nextauth]/route.ts')
      const apiContent = readFileSync(apiRoutePath, 'utf8')

      const checks = {
        importsNextAuth: apiContent.includes('import NextAuth from "next-auth"'),
        importsAuthOptions: apiContent.includes('import authOptions from "@/auth"'),
        exportsHandlers: apiContent.includes('export { handler as GET, handler as POST }'),
        createsHandler: apiContent.includes('const handler = NextAuth(authOptions)')
      }

      const passedChecks = Object.values(checks).filter(Boolean).length
      const totalChecks = Object.keys(checks).length

      return {
        success: passedChecks === totalChecks,
        message: `API route validation: ${passedChecks}/${totalChecks} checks passed`,
        details: checks
      }
    } catch (error) {
      return {
        success: false,
        message: `API route validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  validateDualAuthIntegration(): ValidationResult {
    try {
      const contextPath = join(this.projectRoot, 'lib/server/auth/context.ts')
      const contextContent = readFileSync(contextPath, 'utf8')

      const checks = {
        importsGetServerSession: contextContent.includes('getServerSession'),
        importsAuthOptions: contextContent.includes('import authOptions from "@/auth"'),
        importsNeonAuth: contextContent.includes('getNeonAuthConfig'),
        hasDualAuthLogic: contextContent.includes('authSource: "nextauth" | "neon" | "none"'),
        hasFallbackLogic: contextContent.includes('Try Neon Auth as fallback'),
        exportsAuthContext: contextContent.includes('export async function getAuthContext()')
      }

      const passedChecks = Object.values(checks).filter(Boolean).length
      const totalChecks = Object.keys(checks).length

      return {
        success: passedChecks === totalChecks,
        message: `Dual auth integration validation: ${passedChecks}/${totalChecks} checks passed`,
        details: checks
      }
    } catch (error) {
      return {
        success: false,
        message: `Dual auth validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  runFullValidation(): ValidationResult {
    console.log('🔍 Starting NextAuth Validation...\n')

    const results = {
      configuration: this.validateConfiguration(),
      dependencies: this.validateDependencies(),
      environment: this.validateEnvironmentVariables(),
      authConfig: this.validateAuthConfiguration(),
      apiRoutes: this.validateApiRoutes(),
      dualAuth: this.validateDualAuthIntegration()
    }

    // Print results
    Object.entries(results).forEach(([name, result]) => {
      const status = result.success ? '✅' : '❌'
      console.log(`${status} ${name.charAt(0).toUpperCase() + name.slice(1)}: ${result.message}`)
      
      if (result.details && !result.success) {
        console.log('   Details:', JSON.stringify(result.details, null, 2))
      }
    })

    // Overall assessment
    const allPassed = Object.values(results).every(r => r.success)
    const passedCount = Object.values(results).filter(r => r.success).length
    const totalCount = Object.keys(results).length

    console.log(`\n📊 Overall Result: ${passedCount}/${totalCount} validations passed`)
    console.log(`🎯 Status: ${allPassed ? '✅ READY FOR PRODUCTION' : '⚠️  NEEDS ATTENTION'}`)

    return {
      success: allPassed,
      message: `NextAuth validation complete: ${passedCount}/${totalCount} checks passed`,
      details: results
    }
  }

  private fileExists(path: string): boolean {
    try {
      readFileSync(path, 'utf8')
      return true
    } catch {
      return false
    }
  }

  private isLatestVersion(version: string): boolean {
    // Simple version check - in real implementation, would check against latest
    const [major] = version.split('.')
    return parseInt(major) >= 4
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new NextAuthValidator()
  validator.runFullValidation()
}

export default NextAuthValidator
