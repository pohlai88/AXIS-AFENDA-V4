"use client"

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    // Guard for SSR (shouldn't run anyway because this is a client module).
    if (typeof window === "undefined") return

    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    // Set initial value.
    setIsMobile(mql.matches)

    // Modern browsers.
    if ("addEventListener" in mql) {
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }

    // Safari < 14 fallback.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legacyMql = mql as any
    legacyMql.addListener(onChange)
    return () => legacyMql.removeListener(onChange)
  }, [breakpoint])

  return isMobile
}
