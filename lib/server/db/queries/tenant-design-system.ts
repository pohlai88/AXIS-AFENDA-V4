import "@/lib/server/only"

import { eq } from "drizzle-orm"
import { getDb } from "@/lib/server/db/client"
import { tenantDesignSystem } from "@/lib/server/db/schema"
import type { DesignSystemSettings } from "@/lib/contracts/tenant-design-system"
import { DEFAULT_DESIGN_SYSTEM } from "@/lib/contracts/tenant-design-system"

/**
 * Tenant Design System Queries
 *
 * CRUD operations for tenant-scoped theme settings.
 */

export async function getTenantDesignSystem(tenantId: string) {
  const db = getDb()
  const [result] = await db
    .select()
    .from(tenantDesignSystem)
    .where(eq(tenantDesignSystem.tenantId, tenantId))

  if (!result) {
    return {
      tenantId,
      settings: DEFAULT_DESIGN_SYSTEM,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  return {
    tenantId: result.tenantId,
    settings: { ...DEFAULT_DESIGN_SYSTEM, ...result.settings },
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }
}

export async function upsertTenantDesignSystem(
  tenantId: string,
  settings: DesignSystemSettings
) {
  const db = getDb()

  const [result] = await db
    .insert(tenantDesignSystem)
    .values({
      tenantId,
      settings,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: tenantDesignSystem.tenantId,
      set: {
        settings,
        updatedAt: new Date(),
      },
    })
    .returning()

  return {
    tenantId: result.tenantId,
    settings: { ...DEFAULT_DESIGN_SYSTEM, ...result.settings },
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }
}
