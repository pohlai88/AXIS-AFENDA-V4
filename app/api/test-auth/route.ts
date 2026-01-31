// Test authentication endpoint
import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/server/auth/context'

export async function GET() {
  try {
    const auth = await getAuthContext()
    
    return NextResponse.json({
      success: true,
      auth: {
        userId: auth.userId,
        roles: auth.roles,
        tenantId: auth.tenantId,
        authSource: auth.authSource
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
