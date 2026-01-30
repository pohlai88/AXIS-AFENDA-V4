"use client"

import * as React from "react"
import { toast } from "sonner"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CopyIcon } from "lucide-react"

import { useDesignSystemStore } from "@/lib/client/store/design-system"
import { generateTenantCss } from "@/lib/shared/design-system/css"

type VarMap = Record<string, string>

function parseVarsFromBlock(block: string): VarMap {
  const vars: VarMap = {}
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(block))) {
    vars[`--${match[1]}`] = match[2].trim()
  }
  return vars
}

function parseThemeCss(css: string): { root: VarMap; dark: VarMap } {
  const rootStart = css.indexOf(":root {")
  const darkStart = css.indexOf("\n\n.dark {")

  if (rootStart === -1 || darkStart === -1) {
    return { root: {}, dark: {} }
  }

  const rootBlock = css.slice(rootStart + ":root {".length, darkStart).trim()
  const darkBlock = css
    .slice(darkStart + "\n\n.dark {".length, css.lastIndexOf("}"))
    .trim()

  return {
    root: parseVarsFromBlock(rootBlock),
    dark: parseVarsFromBlock(darkBlock),
  }
}

const TOKEN_ORDER = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--border",
  "--input",
  "--ring",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--radius",
  "--font-sans",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
] as const

function isColorLike(v: string) {
  const s = v.trim().toLowerCase()
  return (
    s.startsWith("oklch(") ||
    s.startsWith("rgb(") ||
    s.startsWith("hsl(") ||
    s.startsWith("#") ||
    s.startsWith("color(")
  )
}

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  } catch {
    toast.error(`Failed to copy ${label}`)
  }
}

function TokenTable({ vars }: { vars: VarMap }) {
  const entries = React.useMemo(() => {
    const keys = new Set(Object.keys(vars))
    const ordered = TOKEN_ORDER.filter((k) => keys.has(k))
    const remaining = Array.from(keys).filter((k) => !TOKEN_ORDER.includes(k as never)).sort()
    return [...ordered, ...remaining].map((k) => [k, vars[k]!] as const)
  }, [vars])

  return (
    <ScrollArea className="h-[320px] rounded-md border">
      <div className="min-w-[520px] divide-y">
        {entries.map(([key, value]) => {
          const showSwatch = isColorLike(value)
          return (
            <div key={key} className="flex items-center gap-3 px-3 py-2 text-sm">
              <div className="w-44 shrink-0 font-mono text-xs text-muted-foreground">
                {key}
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {showSwatch ? (
                  <div
                    className="h-5 w-5 shrink-0 rounded border"
                    style={{ background: value }}
                    title={value}
                  />
                ) : null}
                <div className="min-w-0 flex-1 truncate font-mono text-xs">{value}</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 shrink-0"
                onClick={() => copy(`${key}: ${value};`, key)}
              >
                <CopyIcon className="h-4 w-4" />
                <span className="sr-only">Copy {key}</span>
              </Button>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

export function TokenInspector() {
  const settings = useDesignSystemStore((s) => s.settings)
  const css = React.useMemo(() => generateTenantCss(settings), [settings])
  const parsed = React.useMemo(() => parseThemeCss(css), [css])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="text-sm font-medium">Token inspector</div>
          <p className="text-xs text-muted-foreground">
            Live CSS variables for your current settings.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => copy(css, "CSS")}>
          <CopyIcon className="mr-2 h-4 w-4" />
          Copy full CSS
        </Button>
      </div>

      <Tabs defaultValue="light" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="light">Light (:root)</TabsTrigger>
          <TabsTrigger value="dark">Dark (.dark)</TabsTrigger>
        </TabsList>
        <TabsContent value="light" className="pt-3">
          <TokenTable vars={parsed.root} />
        </TabsContent>
        <TabsContent value="dark" className="pt-3">
          <TokenTable vars={parsed.dark} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

