"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { useDesignSystemStore } from "@/lib/client/store/design-system"
import { generateTenantCss } from "@/lib/shared/design-system/css"
import { getDesignSystemValidationErrors, hasDesignSystemValidationErrors } from "@/lib/shared/design-system/validate"
import { RotateCcwIcon, SaveIcon, CheckIcon, CopyIcon, XIcon, ChevronDownIcon, Undo2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import * as React from "react"
import { TokenInspector } from "./token-inspector"

const BASE_COLORS = [
  { value: "stone", label: "Stone", color: "bg-stone-500" },
  { value: "gray", label: "Gray", color: "bg-gray-500" },
  { value: "zinc", label: "Zinc", color: "bg-zinc-500" },
  { value: "slate", label: "Slate", color: "bg-slate-500" },
  { value: "neutral", label: "Neutral", color: "bg-neutral-500" },
] as const

const BRAND_COLORS = [
  { value: "emerald", label: "Emerald", color: "bg-emerald-500" },
  { value: "blue", label: "Blue", color: "bg-blue-500" },
  { value: "violet", label: "Violet", color: "bg-violet-500" },
  { value: "rose", label: "Rose", color: "bg-rose-500" },
  { value: "orange", label: "Orange", color: "bg-orange-500" },
] as const

const FONTS = [
  { value: "figtree", label: "Figtree" },
  { value: "inter", label: "Inter" },
  { value: "system", label: "System" },
] as const

const THEME_MODES = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const

const PRESETS = [
  {
    name: "Slate + Violet",
    description: "Neutral slate base with violet brand.",
    settings: { baseColor: "slate", brandColor: "violet", radius: 0.75, font: "inter" },
  },
  {
    name: "Neutral + Blue",
    description: "Clean neutral base with blue brand.",
    settings: { baseColor: "neutral", brandColor: "blue", radius: 0.625, font: "system" },
  },
  {
    name: "Zinc + Emerald",
    description: "Modern zinc base with emerald brand.",
    settings: { baseColor: "zinc", brandColor: "emerald", radius: 0.625, font: "figtree" },
  },
  {
    name: "Stone + Rose",
    description: "Warm stone base with rose brand.",
    settings: { baseColor: "stone", brandColor: "rose", radius: 0.875, font: "figtree" },
  },
  {
    name: "Gray + Orange",
    description: "Classic gray base with orange brand.",
    settings: { baseColor: "gray", brandColor: "orange", radius: 0.5, font: "inter" },
  },
] as const

export function CustomizerPanel() {
  const {
    settings,
    setSettings,
    saveSettings,
    resetToDefaults,
    isSaving,
    isDirty,
    autoSave,
    setAutoSave,
    revertToSaved,
  } = useDesignSystemStore()

  const { setTheme } = useTheme()
  const [advancedOpen, setAdvancedOpen] = React.useState(false)

  const errors = React.useMemo(() => getDesignSystemValidationErrors(settings), [settings])
  const hasErrors = React.useMemo(() => hasDesignSystemValidationErrors(errors), [errors])

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied`)
    } catch {
      toast.error(`Failed to copy ${label}`)
    }
  }

  return (
    <Card className="h-fit sticky top-20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Customize</CardTitle>
        <CardDescription>
          Tune your theme tokens and preview components live.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-save */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Auto-save</Label>
            <p className="text-xs text-muted-foreground">
              Saves changes automatically after you stop typing/sliding.
            </p>
          </div>
          <Switch
            checked={autoSave}
            onCheckedChange={setAutoSave}
            aria-label="Toggle auto-save"
          />
        </div>

        <Separator />

        {/* Presets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Presets</Label>
            <Badge variant="secondary" className="text-xs">
              1-click
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSettings(p.settings)}
                title={p.description}
              >
                {p.name}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Presets set base + brand + radius + font. You can tweak anything after applying.
          </p>
        </div>

        <Separator />

        {/* Theme Mode */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Theme</Label>
          <Select
            value={settings.theme ?? "system"}
            onValueChange={(value) => {
              setSettings({ theme: value as typeof settings.theme })
              // Apply immediately so preview matches user selection.
              setTheme(value)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              {THEME_MODES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Base Color */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Base Color</Label>
          <div className="grid grid-cols-5 gap-2">
            {BASE_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setSettings({ baseColor: color.value })}
                className={cn(
                  "size-8 rounded-full border-2 transition-all hover:scale-110",
                  color.color,
                  settings.baseColor === color.value
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-transparent"
                )}
                title={color.label}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Brand Color */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Brand Color</Label>
          <div className="grid grid-cols-5 gap-2">
            {BRAND_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setSettings({ brandColor: color.value })}
                className={cn(
                  "size-8 rounded-full border-2 transition-all hover:scale-110",
                  color.color,
                  settings.brandColor === color.value
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-transparent"
                )}
                title={color.label}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Controls <span className="font-medium">primary</span>, charts, and sidebar primary tokens.
          </p>
        </div>

        <Separator />

        {/* Font */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Font</Label>
          <Select
            value={settings.font ?? "figtree"}
            onValueChange={(value) => setSettings({ font: value as typeof settings.font })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Radius */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Radius</Label>
            <span className="text-xs text-muted-foreground">
              {(settings.radius ?? 0.625).toFixed(2)}rem
            </span>
          </div>
          <Slider
            value={[settings.radius ?? 0.625]}
            onValueChange={([value]) => setSettings({ radius: value })}
            min={0}
            max={1.5}
            step={0.125}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Sharp</span>
            <span>Round</span>
          </div>
        </div>

        <Separator />

        {/* Advanced */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Advanced</Label>
              <p className="text-xs text-muted-foreground">
                Sidebar overrides, export, and validation details.
              </p>
            </div>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                {advancedOpen ? "Hide" : "Show"}
                <ChevronDownIcon
                  className={cn("ml-2 h-4 w-4 transition-transform", advancedOpen && "rotate-180")}
                />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="mt-4 space-y-6">
            {/* Sidebar Overrides */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Sidebar Overrides</Label>
                <p className="text-xs text-muted-foreground">
                  Paste <span className="font-medium">oklch(...)</span> or <span className="font-medium">var(--token)</span>.
                  Per-mode overrides take precedence over “both”.
                </p>
              </div>

              {hasErrors ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                  Some color fields are invalid. Auto-save is paused until you fix them.
                </div>
              ) : null}

              <div className="grid gap-3">
                {/* Both modes (back-compat) */}
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Sidebar background (both)</Label>
                    {settings.menuColor ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                        onClick={() => setSettings({ menuColor: undefined })}
                      >
                        <XIcon className="h-4 w-4" />
                        <span className="sr-only">Clear sidebar background override</span>
                      </Button>
                    ) : null}
                  </div>
                  <Input
                    value={settings.menuColor ?? ""}
                    onChange={(e) => setSettings({ menuColor: e.target.value || undefined })}
                    placeholder='e.g. oklch(0.985 0.001 106.423)'
                    aria-invalid={Boolean(errors.menuColor)}
                  />
                  {errors.menuColor ? (
                    <p className="text-xs text-destructive">{errors.menuColor}</p>
                  ) : null}
                </div>

                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Sidebar accent (both)</Label>
                    {settings.menuAccent ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                        onClick={() => setSettings({ menuAccent: undefined })}
                      >
                        <XIcon className="h-4 w-4" />
                        <span className="sr-only">Clear sidebar accent override</span>
                      </Button>
                    ) : null}
                  </div>
                  <Input
                    value={settings.menuAccent ?? ""}
                    onChange={(e) => setSettings({ menuAccent: e.target.value || undefined })}
                    placeholder='e.g. oklch(0.97 0.001 106.424)'
                    aria-invalid={Boolean(errors.menuAccent)}
                  />
                  {errors.menuAccent ? (
                    <p className="text-xs text-destructive">{errors.menuAccent}</p>
                  ) : null}
                </div>

                <Separator />

                {/* Light mode */}
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Sidebar background (light)</Label>
                    {settings.menuColorLight ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                        onClick={() => setSettings({ menuColorLight: undefined })}
                      >
                        <XIcon className="h-4 w-4" />
                        <span className="sr-only">Clear light sidebar background override</span>
                      </Button>
                    ) : null}
                  </div>
                  <Input
                    value={settings.menuColorLight ?? ""}
                    onChange={(e) => setSettings({ menuColorLight: e.target.value || undefined })}
                    placeholder='e.g. oklch(0.985 0.001 106.423)'
                    aria-invalid={Boolean(errors.menuColorLight)}
                  />
                  {errors.menuColorLight ? (
                    <p className="text-xs text-destructive">{errors.menuColorLight}</p>
                  ) : null}
                </div>

                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Sidebar accent (light)</Label>
                    {settings.menuAccentLight ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                        onClick={() => setSettings({ menuAccentLight: undefined })}
                      >
                        <XIcon className="h-4 w-4" />
                        <span className="sr-only">Clear light sidebar accent override</span>
                      </Button>
                    ) : null}
                  </div>
                  <Input
                    value={settings.menuAccentLight ?? ""}
                    onChange={(e) => setSettings({ menuAccentLight: e.target.value || undefined })}
                    placeholder='e.g. oklch(0.97 0.001 106.424)'
                    aria-invalid={Boolean(errors.menuAccentLight)}
                  />
                  {errors.menuAccentLight ? (
                    <p className="text-xs text-destructive">{errors.menuAccentLight}</p>
                  ) : null}
                </div>

                <Separator />

                {/* Dark mode */}
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Sidebar background (dark)</Label>
                    {settings.menuColorDark ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                        onClick={() => setSettings({ menuColorDark: undefined })}
                      >
                        <XIcon className="h-4 w-4" />
                        <span className="sr-only">Clear dark sidebar background override</span>
                      </Button>
                    ) : null}
                  </div>
                  <Input
                    value={settings.menuColorDark ?? ""}
                    onChange={(e) => setSettings({ menuColorDark: e.target.value || undefined })}
                    placeholder='e.g. oklch(0.216 0.006 56.043)'
                    aria-invalid={Boolean(errors.menuColorDark)}
                  />
                  {errors.menuColorDark ? (
                    <p className="text-xs text-destructive">{errors.menuColorDark}</p>
                  ) : null}
                </div>

                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Sidebar accent (dark)</Label>
                    {settings.menuAccentDark ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                        onClick={() => setSettings({ menuAccentDark: undefined })}
                      >
                        <XIcon className="h-4 w-4" />
                        <span className="sr-only">Clear dark sidebar accent override</span>
                      </Button>
                    ) : null}
                  </div>
                  <Input
                    value={settings.menuAccentDark ?? ""}
                    onChange={(e) => setSettings({ menuAccentDark: e.target.value || undefined })}
                    placeholder='e.g. oklch(0.268 0.007 34.298)'
                    aria-invalid={Boolean(errors.menuAccentDark)}
                  />
                  {errors.menuAccentDark ? (
                    <p className="text-xs text-destructive">{errors.menuAccentDark}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <Separator />

            <TokenInspector />

            <Separator />

            {/* Export */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Export</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateTenantCss(settings), "CSS")}
                >
                  <CopyIcon className="mr-2 h-4 w-4" />
                  Copy CSS
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(settings, null, 2), "JSON")}
                >
                  <CopyIcon className="mr-2 h-4 w-4" />
                  Copy JSON
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use CSS to update your global tokens. JSON is the tenant settings payload.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Preview Boxes */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Preview</Label>
          <div className="grid grid-cols-3 gap-2">
            <div
              className="h-12 rounded-md bg-primary"
              style={{ borderRadius: `${settings.radius ?? 0.625}rem` }}
            />
            <div
              className="h-12 rounded-md bg-secondary"
              style={{ borderRadius: `${settings.radius ?? 0.625}rem` }}
            />
            <div
              className="h-12 rounded-md bg-muted"
              style={{ borderRadius: `${settings.radius ?? 0.625}rem` }}
            />
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            disabled={isSaving}
          >
            <RotateCcwIcon className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={revertToSaved}
            disabled={isSaving || !isDirty}
          >
            <Undo2Icon className="mr-2 h-4 w-4" />
            Revert
          </Button>
          <Button
            size="sm"
            onClick={saveSettings}
            disabled={isSaving || !isDirty || autoSave || hasErrors}
          >
            {isSaving ? (
              <span className="animate-pulse">Saving...</span>
            ) : isDirty ? (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Save
              </>
            ) : (
              <>
                <CheckIcon className="mr-2 h-4 w-4" />
                Saved
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
