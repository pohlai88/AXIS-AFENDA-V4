/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Document card: title, doc type, size, link to detail
 */

"use client"

import Link from "next/link"
import { FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { routes } from "@/lib/routes"

export type DocumentCardDoc = {
  id: string
  title: string | null
  docType: string
  status?: string
  version?: {
    sizeBytes: number
    mimeType?: string
  }
}

type Props = {
  doc: DocumentCardDoc
  showLink?: boolean
}

export function DocumentCard({ doc, showLink = true }: Props) {
  const content = (
    <>
      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{doc.title ?? "(untitled)"}</p>
        <p className="text-xs text-muted-foreground">
          {doc.docType}
          {doc.version ? ` · ${(doc.version.sizeBytes / 1024).toFixed(1)} KB` : ""}
        </p>
      </div>
    </>
  )

  if (showLink) {
    return (
      <Link href={routes.ui.magicfolder.documentById(doc.id)}>
        <Card className="transition-colors hover:bg-muted/50">
          <CardContent className="flex items-center gap-3 pt-4">
            {content}
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-4">
        {content}
      </CardContent>
    </Card>
  )
}
