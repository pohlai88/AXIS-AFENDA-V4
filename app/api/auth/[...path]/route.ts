import "@/lib/server/only"

import { getNeonAuth } from "@/lib/auth/server"

export async function GET(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return getNeonAuth().handler().GET(request, ctx)
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return getNeonAuth().handler().POST(request, ctx)
}

