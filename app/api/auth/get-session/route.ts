/**
 * @domain auth
 * @layer api
 * @responsibility Explicit session retrieval endpoint for Neon Auth client SDK
 *
 * Some Neon Auth client flows call `/api/auth/get-session`.
 * Even though we have a catch-all at `app/api/auth/(auth)/[...path]/route.ts`,
 * this explicit route avoids any routing edge-cases and guarantees the endpoint exists.
 */

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth/server"

const { GET: authGET } = auth.handler()

export async function GET(request: NextRequest) {
  return authGET(request, { params: Promise.resolve({ path: ["get-session"] }) })
}

