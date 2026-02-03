/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Empty state block: message + primary action + optional secondary link
 * Built from Card + Empty (EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent) per shadcn empty-demo.
 */

"use client"

import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { ReactNode } from "react"

export type MagicfolderEmptyStateProps = {
  icon?: ReactNode
  title: string
  description: string
  primaryAction?: ReactNode
  secondaryLink?: ReactNode
}

export function MagicfolderEmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryLink,
}: MagicfolderEmptyStateProps) {
  return (
    <Card>
      <Empty>
        <EmptyHeader>
          {icon != null && (
            <EmptyMedia variant="icon">{icon}</EmptyMedia>
          )}
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        {primaryAction != null && (
          <EmptyContent>
            <div className="flex flex-wrap justify-center gap-2">
              {primaryAction}
            </div>
          </EmptyContent>
        )}
        {secondaryLink != null && (
          <div className="mt-2 flex justify-center">
            {secondaryLink}
          </div>
        )}
      </Empty>
    </Card>
  )
}
