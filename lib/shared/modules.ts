export type ModuleKind = "iframe"

export type ModuleDefinition = {
  slug: string
  name: string
  kind: ModuleKind
  description?: string
  href: string
  enabled?: boolean
}

/**
 * Registry of shell modules.
 *
 * Best practice: keep integrations behind this registry so the shell remains stable
 * even when individual tools change (Chatwoot/Matrix/Jitsi/etc).
 */
export const modules: readonly ModuleDefinition[] = [
  {
    slug: "chatwoot",
    name: "Chatwoot",
    kind: "iframe",
    description: "Customer omnichannel inbox (embedded).",
    href: "https://app.chatwoot.com",
    enabled: true,
  },
  {
    slug: "jitsi",
    name: "Jitsi",
    kind: "iframe",
    description: "Consultation rooms (embedded).",
    href: "https://meet.jit.si",
    enabled: true,
  },
] as const

export function getModuleBySlug(slug: string): ModuleDefinition | undefined {
  return modules.find((m) => m.slug === slug)
}

