/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Nav links block: row of links (owns flex layout so pages don't use raw flex)
 * Built from shadcn/Link only.
 */

"use client"

import Link from "next/link"

export type MagicfolderNavLinkItem = { href: string; label: string }

export type MagicfolderNavLinksProps = {
  items: MagicfolderNavLinkItem[]
  separator?: string
}

export function MagicfolderNavLinks({
  items,
  separator = "·",
}: MagicfolderNavLinksProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item, i) => (
        <span key={item.href} className="flex items-center gap-2">
          {i > 0 && <span className="text-muted-foreground">{separator}</span>}
          <Link
            href={item.href}
            className="text-sm font-medium text-primary hover:underline"
          >
            {item.label}
          </Link>
        </span>
      ))}
    </div>
  )
}
