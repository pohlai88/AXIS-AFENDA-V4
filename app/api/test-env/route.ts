import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
    // NOTE: NextAuth-related env vars removed during auth migration.
    timestamp: new Date().toISOString()
  })
}
