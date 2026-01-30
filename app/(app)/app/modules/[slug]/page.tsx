import { notFound } from "next/navigation"

import { getModuleBySlug } from "@/lib/shared/modules"

type Props = {
  params: Promise<{ slug: string }>
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

      <div className="rounded-xl border">
        <iframe
          title={mod.name}
          src={mod.href}
          className="h-[75dvh] w-full rounded-xl"
          referrerPolicy="no-referrer"
          sandbox="allow-forms allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  )
}

