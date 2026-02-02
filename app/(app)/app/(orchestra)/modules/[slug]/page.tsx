/**
 * @domain orchestra
 * @layer ui
 * @responsibility UI route entrypoint for /app/modules/:slug
 */

import { notFound } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { getModuleBySlug, modules } from "@/lib/shared/modules"

export const revalidate = 3600

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return modules
    .filter((mod) => mod.enabled !== false)
    .map((mod) => ({
      slug: mod.slug,
    }))
}

export default async function ModuleEmbedPage({ params }: Props) {
  const { slug } = await params
  const mod = getModuleBySlug(slug)
  if (!mod || mod.enabled === false) notFound()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{mod.name}</h1>
        {mod.description ? (
          <p className="text-muted-foreground mt-1">{mod.description}</p>
        ) : null}
      </div>

      <Card className="py-0">
        <CardContent className="px-0 py-0">
          <iframe
            title={mod.name}
            src={mod.href}
            className="h-[75dvh] w-full rounded-2xl"
            referrerPolicy="no-referrer"
            sandbox="allow-forms allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
          />
        </CardContent>
      </Card>
    </div>
  )
}

