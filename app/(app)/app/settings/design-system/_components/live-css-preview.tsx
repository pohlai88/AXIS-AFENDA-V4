"use client"

import { useEffect, useMemo, useRef } from "react"
import { useDesignSystemStore } from "@/lib/client/store/design-system"
import { generateTenantCss } from "@/lib/shared/design-system/css"

/**
 * LiveCssPreview injects a <style> tag that updates CSS variables
 * in real-time as the user adjusts the customizer.
 */
export function LiveCssPreview() {
  const settings = useDesignSystemStore((state) => state.settings)
  const css = useMemo(() => generateTenantCss(settings), [settings])
  const lastCssRef = useRef<string>("")

  useEffect(() => {
    const styleId = "tenant-design-system-preview"
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null

    if (!styleEl) {
      styleEl = document.createElement("style")
      styleEl.id = styleId
      document.head.appendChild(styleEl)
    }

    // Avoid thrashing the DOM on fast slider changes.
    if (lastCssRef.current === css) return
    lastCssRef.current = css

    const raf = requestAnimationFrame(() => {
      styleEl!.textContent = css
    })

    return () => {
      cancelAnimationFrame(raf)
      // Don't remove on cleanup - let it persist for smoother UX.
    }
  }, [css])

  return null
}
