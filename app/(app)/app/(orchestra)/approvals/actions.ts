'use server'

import { headers } from "next/headers"
import { z } from "zod"

import { apiFetch } from "@/lib/api/client"
import { CreateApprovalSchema } from "@/lib/contracts/approvals"
import { routes } from "@/lib/routes"

type ActionState = {
  status: "idle" | "success" | "error"
  message?: string
}

const ResponseSchema = z.any()

async function getRequestOrigin(): Promise<string | null> {
  const h = await headers()
  const proto = h.get("x-forwarded-proto") ?? "http"
  const host = h.get("x-forwarded-host") ?? h.get("host")
  if (!host) return null
  return `${proto}://${host}`
}

export async function createApprovalAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData)
  const parsed = CreateApprovalSchema.safeParse(raw)

  if (!parsed.success) {
    const message = parsed.error.flatten().fieldErrors.title?.[0] ?? "Invalid title"
    return { status: "error", message }
  }

  const origin = await getRequestOrigin()
  if (!origin) {
    return { status: "error", message: "Missing request origin" }
  }

  try {
    await apiFetch(
      new URL(routes.api.orchestra.approvals.list(), origin),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: parsed.data.title }),
        cache: "no-store",
      },
      ResponseSchema
    )

    return { status: "success" }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create approval"
    return { status: "error", message }
  }
}
