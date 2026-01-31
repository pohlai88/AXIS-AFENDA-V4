import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
    // NOTE: Auth-related env vars are managed by Neon Auth during migration.
    timestamp: new Date().toISOString()
  })
}
