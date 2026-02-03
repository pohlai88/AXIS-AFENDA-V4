import { routes } from "@/lib/routes"
import { getMagicfolderCapabilities } from "@/lib/domains/magicfolder/capabilities"

export const magicfolderRegistry = {
  domain: "magicfolder",
  ui: {
    routes: [
      routes.ui.magicfolder.landing(),
      routes.ui.magicfolder.inbox(),
      routes.ui.magicfolder.duplicates(),
      routes.ui.magicfolder.unsorted(),
      routes.ui.magicfolder.search(),
      routes.ui.magicfolder.collections(),
      routes.ui.magicfolder.documentById(":id"),
      routes.ui.magicfolder.audit(),
    ],
  },
  api: {
    routes: [
      routes.api.v1.magicfolder.presign(),
      routes.api.v1.magicfolder.ingest(),
      routes.api.v1.magicfolder.keepBest(),
      routes.api.v1.magicfolder.list(),
      routes.api.v1.magicfolder.duplicateGroups(),
      routes.api.v1.magicfolder.duplicateGroupById(":id"),
      routes.api.v1.magicfolder.bulk(),
      routes.api.v1.magicfolder.objectById(":id"),
      routes.api.v1.magicfolder.objectSourceUrl(":id"),
      routes.api.v1.magicfolder.objectPreviewUrl(":id"),
      routes.api.v1.magicfolder.objectThumbUrl(":id"),
      routes.api.v1.magicfolder.objectTags(":id"),
      routes.api.v1.magicfolder.tags(),
      routes.api.v1.magicfolder.auditHash(),
    ],
  },
  /** Capabilities drive UI affordances; from env (NEXT_PUBLIC_MAGICFOLDER_*). */
  get capabilities() {
    return getMagicfolderCapabilities()
  },
  dependsOn: ["shared", "auth", "tenancy"] as const,
} as const
