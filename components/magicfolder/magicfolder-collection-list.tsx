/**
 * @domain magicfolder
 * @layer ui
 * @responsibility List/grid of virtual collections (by tag, type, or counterparty)
 */

"use client"

import Link from "next/link"
import { FolderOpen } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { routes } from "@/lib/routes"
import { DOC_TYPE } from "@/lib/constants/magicfolder"

export type CollectionItem = {
  id: string
  label: string
  href: string
  description?: string
}

const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: "Invoices",
  contract: "Contracts",
  receipt: "Receipts",
  other: "Other",
}

export function CollectionList() {
  const collections: CollectionItem[] = Object.values(DOC_TYPE).map((docType) => ({
    id: docType,
    label: DOC_TYPE_LABELS[docType] ?? docType,
    href: `${routes.ui.magicfolder.search()}?docType=${docType}`,
    description: `View documents with type "${docType}"`,
  }))

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {collections.map((c) => (
        <Link key={c.id} href={c.href}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">{c.label}</CardTitle>
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>{c.description}</CardDescription>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
