"use client"

import { useReportWebVitals } from "next/web-vitals"
import { routes } from "@/lib/routes"

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log metrics in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[WebVitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
      })
    }

    // Send to analytics endpoint in production
    if (process.env.NODE_ENV === "production") {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        navigationType: metric.navigationType,
      })

      const url = routes.api.analytics.webVitals()

      // Use sendBeacon for reliability, fallback to fetch
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, body)
      } else {
        fetch(url, {
          body,
          method: "POST",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
        }).catch((error) => {
          console.error("[WebVitals] Failed to send metrics:", error)
        })
      }
    }
  })

  return null
}
