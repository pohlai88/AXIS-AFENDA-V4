/**
 * @domain magicfolder
 * @layer ui
 * @responsibility MagicFolder settings form using shadcn components
 */

"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Settings,
  Tag,
  Eye,
  Share2,
  Bell,
  Palette,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  LayoutList,
  Star,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import Link from "next/link"
import { routes } from "@/lib/routes"
import {
  DOC_TYPE,
  STATUS,
  VIEW_MODES,
  ITEMS_PER_PAGE_OPTIONS,
  SORT_OPTIONS,
  ALLOWED_MIME_TYPES,
} from "@/lib/constants/magicfolder"

interface SettingsState {
  general: {
    defaultView: "cards" | "table" | "board" | "timeline" | "relationship"
    itemsPerPage: number
    defaultSort: string
    defaultStatusFilter: string
    defaultDocTypeFilter: string
    showFileExtensions: boolean
    showThumbnails: boolean
    compactMode: boolean
  }
  tags: {
    items: { id: string; name: string; color: string }[]
  }
  status: {
    customNames: Record<string, string>
    colors: Record<string, string>
  }
  sharing: {
    defaultPermission: "view" | "edit"
    linkExpiration: number
    allowPublicLinks: boolean
  }
  notifications: {
    emailOnShare: boolean
    emailOnComment: boolean
    browserNotifications: boolean
  }
}

type TenantSettingsData = {
  documentTypes: Array<{ value: string; label: string; enabled: boolean }>
  statusWorkflow: Array<{ value: string; label: string; color: string; enabled: boolean }>
  enableAiSuggestions: boolean
  enablePublicShares: boolean
  maxFileSizeMb: number
  allowedFileTypes: string[]
}

const DEFAULT_SETTINGS: SettingsState = {
  general: {
    defaultView: "cards",
    itemsPerPage: 20,
    defaultSort: "createdAt-desc",
    defaultStatusFilter: STATUS.INBOX,
    defaultDocTypeFilter: DOC_TYPE.OTHER,
    showFileExtensions: true,
    showThumbnails: true,
    compactMode: false,
  },
  tags: {
    items: [
      { id: "1", name: "Important", color: "#ef4444" },
      { id: "2", name: "Work", color: "#3b82f6" },
      { id: "3", name: "Personal", color: "#22c55e" },
    ],
  },
  status: {
    customNames: {
      inbox: "Inbox",
      active: "Active",
      archived: "Archived",
      deleted: "Deleted",
    },
    colors: {
      inbox: "#3b82f6",
      active: "#22c55e",
      archived: "#6b7280",
      deleted: "#ef4444",
    },
  },
  sharing: {
    defaultPermission: "view",
    linkExpiration: 7,
    allowPublicLinks: false,
  },
  notifications: {
    emailOnShare: true,
    emailOnComment: true,
    browserNotifications: false,
  },
}

const DEFAULT_TENANT_SETTINGS: TenantSettingsData = {
  documentTypes: [
    { value: "invoice", label: "Invoices", enabled: true },
    { value: "contract", label: "Contracts", enabled: true },
    { value: "receipt", label: "Receipts", enabled: true },
    { value: "other", label: "Other", enabled: true },
  ],
  statusWorkflow: [
    { value: "inbox", label: "Inbox", color: "#3b82f6", enabled: true },
    { value: "active", label: "Active", color: "#22c55e", enabled: true },
    { value: "archived", label: "Archived", color: "#6b7280", enabled: true },
    { value: "deleted", label: "Deleted", color: "#ef4444", enabled: true },
  ],
  enableAiSuggestions: true,
  enablePublicShares: true,
  maxFileSizeMb: 100,
  allowedFileTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/tiff"],
}

export function MagicFolderSettings() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newTagName, setNewTagName] = useState("")
  const [tenantSettings, setTenantSettings] = useState<TenantSettingsData | null>(null)
  const [tenantLoading, setTenantLoading] = useState(false)
  const [tenantSaving, setTenantSaving] = useState(false)
  const [savedViews, setSavedViews] = useState<{ id: string; name: string; description?: string; isDefault: boolean }[]>([])
  const [savedViewsLoading, setSavedViewsLoading] = useState(false)
  const [savedViewDialogOpen, setSavedViewDialogOpen] = useState(false)
  const [newViewName, setNewViewName] = useState("")
  const [newViewDescription, setNewViewDescription] = useState("")
  const [newViewIsDefault, setNewViewIsDefault] = useState(false)

  // Load settings, tags, tenant settings, and saved views on mount
  useEffect(() => {
    loadSettings()
    loadTags()
    loadTenantSettings()
    loadSavedViews()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(routes.api.v1.magicfolder.preferences(), {
        credentials: "include",
      })

      if (!response.ok) throw new Error("Failed to load settings")

      const data = await response.json()
      const prefs = data.data?.preferences

      if (prefs) {
        const qs = prefs.quickSettings ?? {}
        setSettings((prev) => ({
          ...prev,
          general: {
            defaultView: prefs.defaultView ?? prev.general.defaultView,
            itemsPerPage: prefs.itemsPerPage ?? prev.general.itemsPerPage,
            defaultSort: prefs.defaultSort ?? prev.general.defaultSort,
            defaultStatusFilter: qs.defaultStatusFilter ?? prev.general.defaultStatusFilter,
            defaultDocTypeFilter: qs.defaultDocTypeFilter ?? prev.general.defaultDocTypeFilter,
            showFileExtensions: prefs.showFileExtensions ?? prev.general.showFileExtensions,
            showThumbnails: prefs.showThumbnails ?? prev.general.showThumbnails,
            compactMode: prefs.compactMode ?? prev.general.compactMode,
          },
        }))
      }
    } catch (error) {
      toast.error("Failed to load settings")
    } finally {
      setIsLoading(false)
    }
  }

  const loadTags = async () => {
    try {
      const response = await fetch(routes.api.v1.magicfolder.tags(), {
        credentials: "include",
      })
      if (!response.ok) return
      const data = await response.json()
      const items = data.data?.items ?? []
      setSettings((prev) => ({
        ...prev,
        tags: {
          items: items.map((t: { id: string; name: string }) => ({
            id: t.id,
            name: t.name,
            color: "#6b7280",
          })),
        },
      }))
    } catch {
      // Non-blocking; tags tab can still show empty
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(routes.api.v1.magicfolder.preferences(), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          defaultView: settings.general.defaultView,
          itemsPerPage: settings.general.itemsPerPage.toString(),
          defaultSort: settings.general.defaultSort,
          showFileExtensions: settings.general.showFileExtensions,
          showThumbnails: settings.general.showThumbnails,
          compactMode: settings.general.compactMode,
          quickSettings: {
            defaultStatusFilter: settings.general.defaultStatusFilter,
            defaultDocTypeFilter: settings.general.defaultDocTypeFilter,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to save settings")

      toast.success("Settings saved successfully")
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS)
    toast.info("Settings reset to defaults")
  }

  const addTag = async () => {
    if (!newTagName.trim()) return
    try {
      const response = await fetch(routes.api.v1.magicfolder.tags(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newTagName.trim() }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err?.message ?? "Failed to add tag")
      }
      setNewTagName("")
      await loadTags()
      toast.success("Tag added")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add tag")
    }
  }

  const removeTag = async (id: string) => {
    try {
      const response = await fetch(routes.api.v1.magicfolder.tagById(id), {
        method: "DELETE",
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to remove tag")
      await loadTags()
      toast.success("Tag removed")
    } catch {
      toast.error("Failed to remove tag")
    }
  }

  const loadTenantSettings = async () => {
    setTenantLoading(true)
    try {
      const res = await fetch(routes.api.v1.magicfolder.tenantSettings(), { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      const s = data.data?.settings
      if (s) {
        setTenantSettings({
          documentTypes: Array.isArray(s.documentTypes) ? s.documentTypes : DEFAULT_TENANT_SETTINGS.documentTypes,
          statusWorkflow: Array.isArray(s.statusWorkflow) ? s.statusWorkflow : DEFAULT_TENANT_SETTINGS.statusWorkflow,
          enableAiSuggestions: s.enableAiSuggestions ?? true,
          enablePublicShares: s.enablePublicShares ?? true,
          maxFileSizeMb: s.maxFileSizeMb ?? 100,
          allowedFileTypes: Array.isArray(s.allowedFileTypes) ? s.allowedFileTypes : DEFAULT_TENANT_SETTINGS.allowedFileTypes,
        })
      } else {
        setTenantSettings(DEFAULT_TENANT_SETTINGS)
      }
    } catch {
      setTenantSettings(DEFAULT_TENANT_SETTINGS)
    } finally {
      setTenantLoading(false)
    }
  }

  const saveTenantSettings = async () => {
    const payload = tenantSettings ?? DEFAULT_TENANT_SETTINGS
    setTenantSaving(true)
    try {
      const res = await fetch(routes.api.v1.magicfolder.tenantSettings(), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          documentTypes: payload.documentTypes,
          statusWorkflow: payload.statusWorkflow,
          enableAiSuggestions: payload.enableAiSuggestions,
          enablePublicShares: payload.enablePublicShares,
          maxFileSizeMb: payload.maxFileSizeMb,
          allowedFileTypes: payload.allowedFileTypes,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err?.error?.message ?? "Failed to save")
      }
      toast.success("Organization settings saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save organization settings")
    } finally {
      setTenantSaving(false)
    }
  }

  const loadSavedViews = async () => {
    setSavedViewsLoading(true)
    try {
      const res = await fetch(`${routes.api.v1.magicfolder.savedViews()}?limit=50&offset=0`, {
        credentials: "include",
      })
      if (!res.ok) return
      const data = await res.json()
      const items = data.data?.items ?? []
      setSavedViews(
        items.map((v: { id: string; name: string; description?: string; isDefault: boolean }) => ({
          id: v.id,
          name: v.name,
          description: v.description,
          isDefault: v.isDefault,
        }))
      )
    } catch {
      setSavedViews([])
    } finally {
      setSavedViewsLoading(false)
    }
  }

  const createSavedView = async () => {
    if (!newViewName.trim()) return
    try {
      const res = await fetch(routes.api.v1.magicfolder.savedViews(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newViewName.trim(),
          description: newViewDescription.trim() || undefined,
          filters: {},
          viewMode: "cards",
          sortBy: "createdAt",
          sortOrder: "desc",
          isPublic: false,
          isDefault: newViewIsDefault,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err?.error?.message ?? "Failed to create")
      }
      setNewViewName("")
      setNewViewDescription("")
      setNewViewIsDefault(false)
      setSavedViewDialogOpen(false)
      await loadSavedViews()
      toast.success("Saved view created")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create saved view")
    }
  }

  const setDefaultSavedView = async (id: string) => {
    try {
      const res = await fetch(routes.api.v1.magicfolder.savedViewById(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isDefault: true }),
      })
      if (!res.ok) throw new Error("Failed to set default")
      await loadSavedViews()
      toast.success("Default view updated")
    } catch {
      toast.error("Failed to set default view")
    }
  }

  const deleteSavedView = async (id: string) => {
    if (!window.confirm("Delete this saved view?")) return
    try {
      const res = await fetch(routes.api.v1.magicfolder.savedViewById(id), {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to delete")
      await loadSavedViews()
      toast.success("Saved view deleted")
    } catch {
      toast.error("Failed to delete saved view")
    }
  }

  const org = tenantSettings ?? DEFAULT_TENANT_SETTINGS

  return (
    <div className="space-y-6">
      {isLoading ? (
        <SettingsLoadingSkeleton />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href={routes.ui.magicfolder.root()}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">MagicFolder Settings</h1>
                <p className="text-muted-foreground">
                  Configure your document management preferences
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Settings Tabs */}
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">
                <Settings className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="tags">
                <Tag className="h-4 w-4 mr-2" />
                Tags
              </TabsTrigger>
              <TabsTrigger value="saved-views">
                <LayoutList className="h-4 w-4 mr-2" />
                Saved views
              </TabsTrigger>
              <TabsTrigger value="display">
                <Eye className="h-4 w-4 mr-2" />
                Display
              </TabsTrigger>
              <TabsTrigger value="sharing">
                <Share2 className="h-4 w-4 mr-2" />
                Sharing
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="tenant">
                <Palette className="h-4 w-4 mr-2" />
                Organization
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure default view and sorting preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="defaultView">Default View</Label>
                      <Select
                        value={settings.general.defaultView}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: { ...prev.general, defaultView: value as SettingsState["general"]["defaultView"] },
                          }))
                        }
                      >
                        <SelectTrigger id="defaultView">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VIEW_MODES.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="itemsPerPage">Items Per Page</Label>
                      <Select
                        value={settings.general.itemsPerPage.toString()}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: { ...prev.general, itemsPerPage: parseInt(value) },
                          }))
                        }
                      >
                        <SelectTrigger id="itemsPerPage">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n} items
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defaultSort">Default Sort</Label>
                      <Select
                        value={settings.general.defaultSort}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: { ...prev.general, defaultSort: value },
                          }))
                        }
                      >
                        <SelectTrigger id="defaultSort">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SORT_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defaultStatusFilter">Default Status Filter</Label>
                      <Select
                        value={settings.general.defaultStatusFilter}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: { ...prev.general, defaultStatusFilter: value },
                          }))
                        }
                      >
                        <SelectTrigger id="defaultStatusFilter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS).map(([key, value]) => (
                            <SelectItem key={value} value={value}>
                              {key.charAt(0) + key.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defaultDocTypeFilter">Default Doc Type Filter</Label>
                      <Select
                        value={settings.general.defaultDocTypeFilter}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: { ...prev.general, defaultDocTypeFilter: value },
                          }))
                        }
                      >
                        <SelectTrigger id="defaultDocTypeFilter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(DOC_TYPE).map(([key, value]) => (
                            <SelectItem key={value} value={value}>
                              {key.charAt(0) + key.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tags Tab */}
            <TabsContent value="tags">
              <Card>
                <CardHeader>
                  <CardTitle>Tag Management</CardTitle>
                  <CardDescription>
                    Create, edit, and delete tags for organizing documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add new tag */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="New tag name..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTag()}
                    />
                    <Button onClick={addTag}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tag
                    </Button>
                  </div>

                  <Separator />

                  {/* Tag list */}
                  <div className="space-y-2">
                    {settings.tags.items.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="font-medium">{tag.name}</span>
                          <Badge variant="secondary">{tag.color}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={tag.color}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                tags: {
                                  items: prev.tags.items.map((t) =>
                                    t.id === tag.id ? { ...t, color: e.target.value } : t
                                  ),
                                },
                              }))
                            }
                            className="w-10 h-8 p-0 border-0"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTag(tag.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Saved views Tab */}
            <TabsContent value="saved-views">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Saved views</CardTitle>
                      <CardDescription>
                        Save filter and view combinations; set one as default for the hub
                      </CardDescription>
                    </div>
                    <Button onClick={() => setSavedViewDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add saved view
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {savedViewsLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : savedViews.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No saved views yet. Create one to quickly restore a filter and view setup.</p>
                  ) : (
                    <div className="space-y-2">
                      {savedViews.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{v.name}</span>
                            {v.description && (
                              <span className="text-sm text-muted-foreground">{v.description}</span>
                            )}
                            {v.isDefault && (
                              <Badge variant="secondary">
                                <Star className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!v.isDefault && (
                              <Button variant="outline" size="sm" onClick={() => setDefaultSavedView(v.id)}>
                                Set as default
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => deleteSavedView(v.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Display Tab */}
            <TabsContent value="display">
              <Card>
                <CardHeader>
                  <CardTitle>Display Preferences</CardTitle>
                  <CardDescription>
                    Customize how documents are displayed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show File Extensions</Label>
                        <p className="text-sm text-muted-foreground">
                          Display file extensions in document titles
                        </p>
                      </div>
                      <Switch
                        checked={settings.general.showFileExtensions}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: { ...prev.general, showFileExtensions: checked },
                          }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Thumbnails</Label>
                        <p className="text-sm text-muted-foreground">
                          Display document previews and thumbnails
                        </p>
                      </div>
                      <Switch
                        checked={settings.general.showThumbnails}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: { ...prev.general, showThumbnails: checked },
                          }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Compact Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Reduce spacing for more compact display
                        </p>
                      </div>
                      <Switch
                        checked={settings.general.compactMode}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            general: { ...prev.general, compactMode: checked },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Status Colors */}
                  <Accordion type="single" collapsible>
                    <AccordionItem value="status-colors">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Status Colors
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          {Object.entries(settings.status.customNames).map(([key, name]) => (
                            <div key={key} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: settings.status.colors[key] }}
                                />
                                <span>{name}</span>
                              </div>
                              <Input
                                type="color"
                                value={settings.status.colors[key]}
                                onChange={(e) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    status: {
                                      ...prev.status,
                                      colors: { ...prev.status.colors, [key]: e.target.value },
                                    },
                                  }))
                                }
                                className="w-10 h-8 p-0 border-0"
                              />
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sharing Tab */}
            <TabsContent value="sharing">
              <Card>
                <CardHeader>
                  <CardTitle>Sharing Defaults</CardTitle>
                  <CardDescription>
                    Configure default sharing permissions and link settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="defaultPermission">Default Permission</Label>
                      <Select
                        value={settings.sharing.defaultPermission}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            sharing: { ...prev.sharing, defaultPermission: value as "view" | "edit" },
                          }))
                        }
                      >
                        <SelectTrigger id="defaultPermission">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View Only</SelectItem>
                          <SelectItem value="edit">Can Edit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkExpiration">Link Expiration (days)</Label>
                      <Select
                        value={settings.sharing.linkExpiration.toString()}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            sharing: { ...prev.sharing, linkExpiration: parseInt(value) },
                          }))
                        }
                      >
                        <SelectTrigger id="linkExpiration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="0">Never expire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Public Links</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow creating links that anyone can access
                      </p>
                    </div>
                    <Switch
                      checked={settings.sharing.allowPublicLinks}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          sharing: { ...prev.sharing, allowPublicLinks: checked },
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Manage how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email on Share</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email when someone shares a document with you
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.emailOnShare}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifications: { ...prev.notifications, emailOnShare: checked },
                          }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email on Comment</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email when someone comments on your document
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.emailOnComment}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifications: { ...prev.notifications, emailOnComment: checked },
                          }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Browser Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable browser push notifications
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.browserNotifications}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifications: { ...prev.notifications, browserNotifications: checked },
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tenant Settings Tab (Organization-wide) */}
            <TabsContent value="tenant">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Organization Settings</CardTitle>
                      <CardDescription>
                        Configure organization-wide defaults (Admin only)
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Admin</Badge>
                      <Button onClick={saveTenantSettings} disabled={tenantLoading || tenantSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {tenantSaving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {tenantLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <>
                      <Accordion type="single" collapsible defaultValue="document-types">
                        <AccordionItem value="document-types">
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              Document Types
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-4">
                              <p className="text-sm text-muted-foreground">
                                Customize document type classifications available across your organization
                              </p>
                              <div className="space-y-2">
                                {org.documentTypes.map((type) => (
                                  <div
                                    key={type.value}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="font-medium">{type.label}</span>
                                      <Badge variant="outline">{type.value}</Badge>
                                    </div>
                                    <Switch
                                      checked={type.enabled}
                                      onCheckedChange={(checked: boolean) =>
                                        setTenantSettings((prev) => ({
                                          ...prev ?? DEFAULT_TENANT_SETTINGS,
                                          documentTypes: (prev ?? DEFAULT_TENANT_SETTINGS).documentTypes.map((t) =>
                                            t.value === type.value ? { ...t, enabled: checked } : t
                                          ),
                                        }))
                                      }
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="status-workflow">
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Status Workflow
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-4">
                              <p className="text-sm text-muted-foreground">
                                Configure status stages and colors for document lifecycle
                              </p>
                              <div className="space-y-2">
                                {org.statusWorkflow.map((status) => (
                                  <div
                                    key={status.value}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: status.color }}
                                      />
                                      <span className="font-medium">{status.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="color"
                                        value={status.color}
                                        onChange={(e) =>
                                          setTenantSettings((prev) => {
                                            const p = prev ?? DEFAULT_TENANT_SETTINGS
                                            return {
                                              ...p,
                                              statusWorkflow: p.statusWorkflow.map((s) =>
                                                s.value === status.value ? { ...s, color: e.target.value } : s
                                              ),
                                            }
                                          })
                                        }
                                        className="w-10 h-8 p-0 border-0"
                                      />
                                      <Switch
                                        checked={status.enabled}
                                        onCheckedChange={(checked: boolean) =>
                                          setTenantSettings((prev) => {
                                            const p = prev ?? DEFAULT_TENANT_SETTINGS
                                            return {
                                              ...p,
                                              statusWorkflow: p.statusWorkflow.map((s) =>
                                                s.value === status.value ? { ...s, enabled: checked } : s
                                              ),
                                            }
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="limits">
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Limits &amp; Quotas
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-4">
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>Max File Size (MB)</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={1000}
                                    value={org.maxFileSizeMb}
                                    onChange={(e) =>
                                      setTenantSettings((prev) => ({
                                        ...prev ?? DEFAULT_TENANT_SETTINGS,
                                        maxFileSizeMb: Math.min(1000, Math.max(1, parseInt(e.target.value, 10) || 100)),
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Allowed file types</Label>
                                <p className="text-sm text-muted-foreground">
                                  MIME types that can be uploaded (at least one required)
                                </p>
                                <div className="flex flex-wrap gap-4 pt-2">
                                  {ALLOWED_MIME_TYPES.map((mime) => {
                                    const isChecked = org.allowedFileTypes.includes(mime)
                                    return (
                                      <div
                                        key={mime}
                                        className="flex items-center space-x-2"
                                      >
                                        <Checkbox
                                          id={`mime-${mime}`}
                                          checked={isChecked}
                                          onCheckedChange={(checked) => {
                                            setTenantSettings((prev) => {
                                              const p = prev ?? DEFAULT_TENANT_SETTINGS
                                              const next = checked
                                                ? [...p.allowedFileTypes, mime].filter(
                                                  (x, i, a) => a.indexOf(x) === i
                                                )
                                                : p.allowedFileTypes.filter((x) => x !== mime)
                                              return { ...p, allowedFileTypes: next.length ? next : p.allowedFileTypes }
                                            })
                                          }}
                                        />
                                        <label
                                          htmlFor={`mime-${mime}`}
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                          {mime.replace("image/", "").replace("application/", "")}
                                        </label>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label>AI Suggestions</Label>
                                  <p className="text-sm text-muted-foreground">
                                    Enable AI-powered document classification
                                  </p>
                                </div>
                                <Switch
                                  checked={org.enableAiSuggestions}
                                  onCheckedChange={(checked) =>
                                    setTenantSettings((prev) => ({
                                      ...prev ?? DEFAULT_TENANT_SETTINGS,
                                      enableAiSuggestions: checked,
                                    }))
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label>Public Sharing</Label>
                                  <p className="text-sm text-muted-foreground">
                                    Allow users to create public share links
                                  </p>
                                </div>
                                <Switch
                                  checked={org.enablePublicShares}
                                  onCheckedChange={(checked) =>
                                    setTenantSettings((prev) => ({
                                      ...prev ?? DEFAULT_TENANT_SETTINGS,
                                      enablePublicShares: checked,
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      <div className="flex justify-end">
                        <Button onClick={saveTenantSettings} disabled={tenantSaving}>
                          <Save className="h-4 w-4 mr-2" />
                          {tenantSaving ? "Saving..." : "Save organization settings"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Dialog open={savedViewDialogOpen} onOpenChange={setSavedViewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add saved view</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="saved-view-name">Name</Label>
                  <Input
                    id="saved-view-name"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="e.g. Inbox - cards"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saved-view-desc">Description (optional)</Label>
                  <Input
                    id="saved-view-desc"
                    value={newViewDescription}
                    onChange={(e) => setNewViewDescription(e.target.value)}
                    placeholder="Short description"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newViewIsDefault}
                    onCheckedChange={setNewViewIsDefault}
                  />
                  <Label>Set as default view when opening MagicFolder</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSavedViewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createSavedView} disabled={!newViewName.trim()}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}

function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}
