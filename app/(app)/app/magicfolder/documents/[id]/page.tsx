/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Document detail page - view and manage individual documents
 */

import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { DocumentPreview } from "@/components/magicfolder/document-preview/document-preview"
import { getAppBaseUrl } from "@/lib/server/base-url"
import { routes } from "@/lib/routes"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getDocument(id: string) {
  try {
    const baseUrl = await getAppBaseUrl()
    const url = `${baseUrl}${routes.api.v1.magicfolder.objectById(id)}`
    const h = await headers()
    const cookie = h.get("cookie")
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.data
  } catch {
    return null
  }
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params
  const document = await getDocument(id)

  if (!document) {
    notFound()
  }

  return (
    <div className="h-full">
      <DocumentPreview document={document} />
    </div>
  )
}
