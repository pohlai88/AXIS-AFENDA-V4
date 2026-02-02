'use client'

import { useEffect } from 'react'

interface PageViewTrackerProps {
  pageName: string
  metadata?: Record<string, unknown>
}

/**
 * Client component for tracking page views
 * 
 * Pattern: Isolates side-effects from server components
 * Prevents double-counting during prefetch
 * Only runs useEffect on actual navigation (after hydration)
 * 
 * Usage:
 * ```tsx
 * // In layout or page
 * import { PageViewTracker } from '@/components/page-view-tracker'
 * 
 * export default function Layout({ children }) {
 *   return (
 *     <div>
 *       <PageViewTracker pageName="Dashboard" />
 *       {children}
 *     </div>
 *   )
 * }
 * ```
 * 
 * Why This Approach:
 * - ✅ Server components remain pure
 * - ✅ Analytics only triggers on actual navigation
 * - ✅ useEffect prevents double-counting during prefetch
 * - ✅ Follows Next.js best practices
 * - ✅ Works with all prefetch strategies
 */
export function PageViewTracker({ 
  pageName, 
  metadata 
}: PageViewTrackerProps) {
  useEffect(() => {
    // Only runs after client hydration, not during prefetch
    const trackPageView = async () => {
      try {
        const payload = {
          pageName,
          timestamp: new Date().toISOString(),
          url: window.location.pathname,
          metadata: metadata || {},
        }

        // Send to your analytics endpoint
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            '/api/analytics/page-view',
            JSON.stringify(payload)
          )
        } else {
          await fetch('/api/analytics/page-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
          })
        }
      } catch (error) {
        console.error('[PageViewTracker] Failed to track page view:', error)
      }
    }

    trackPageView()
  }, [pageName, metadata])

  return null
}
