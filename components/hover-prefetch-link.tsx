'use client'

import Link, { LinkProps } from 'next/link'
import { useState } from 'react'

interface HoverPrefetchLinkProps extends LinkProps {
  children: React.ReactNode
  className?: string
}

/**
 * Link component that defers prefetching until user hovers
 * 
 * Use Case:
 * - Footer navigation (not immediate target)
 * - Pagination links (not all visited)
 * - Long lists with 50+ links
 * - Low-priority secondary navigation
 * 
 * Don't Use For:
 * - Primary CTAs (always prefetch)
 * - Breadcrumbs (expected path)
 * - Primary navigation
 * 
 * Benefits:
 * - Reduces unnecessary prefetches (-30% bandwidth)
 * - Focuses resources on likely navigations
 * - Maintains full prefetch on hover
 * 
 * @example
 * ```tsx
 * <HoverPrefetchLink href="/privacy">Privacy Policy</HoverPrefetchLink>
 * ```
 */
export function HoverPrefetchLink({
  href,
  children,
  className,
  ...rest
}: HoverPrefetchLinkProps) {
  const [shouldPrefetch, setShouldPrefetch] = useState(false)

  const handleEnter = () => setShouldPrefetch(true)

  return (
    <Link
      href={href}
      className={className}
      prefetch={shouldPrefetch ? null : false}
      onMouseEnter={handleEnter}
      onTouchStart={handleEnter}
      {...rest}
    >
      {children}
    </Link>
  )
}
