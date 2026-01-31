import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
    AUTH_SECRET: process.env.AUTH_SECRET ? 'SET' : 'NOT_SET',
    SESSION_SECRET: process.env.SESSION_SECRET ? 'SET' : 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
    ENABLE_DEV_CREDENTIALS: process.env.ENABLE_DEV_CREDENTIALS,
    DEV_AUTH_USERNAME: process.env.DEV_AUTH_USERNAME,
    timestamp: new Date().toISOString()
  })
}
