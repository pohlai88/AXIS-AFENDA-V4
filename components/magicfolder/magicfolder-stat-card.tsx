/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Stat card block for landing: title, value, description, link (owns typography)
 * Built from Card + Link only; shadcn design tokens for value/description.
 */

"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type MagicfolderStatCardProps = {
  title: string
  value: string | number
  description: string
  href: string
  icon?: ReactNode
}

export function MagicfolderStatCard({
  title,
  value,
  description,
  href,
  icon,
}: MagicfolderStatCardProps) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {icon != null && (
            <span className="text-muted-foreground [&_svg]:size-5">{icon}</span>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}
