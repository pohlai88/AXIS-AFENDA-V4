/**
 * @domain magicfolder
 * @layer ui
 * @responsibility Collections: virtual folders by doc type and by tag
 * Composes blocks only: MagicfolderPageHeader, MagicfolderSection, Card, Dialog, Button, Input.
 */

"use client"

import { useCallback, useEffect, useState } from "react"

import { routes } from "@/lib/routes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"

import {
  MagicfolderPageHeader,
  MagicfolderSection,
  MagicfolderLoading,
  CollectionList,
  MagicfolderHelperText,
} from "@/components/magicfolder"
import { Tag, Plus } from "lucide-react"

type TagRow = {
  id: string
  name: string
  slug: string
}

type TagsResponse = {
  data: { items: TagRow[] } | null
  error: { code: string; message: string } | null
}

export default function MagicFolderCollectionsPage() {
  const [tags, setTags] = useState<TagRow[]>([])
  const [tagsLoading, setTagsLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const fetchTags = useCallback(() => {
    setTagsLoading(true)
    fetch(routes.api.v1.magicfolder.tags(), { credentials: "include" })
      .then((r) => r.json() as Promise<TagsResponse>)
      .then((res) => {
        if (res.data?.items) setTags(res.data.items)
      })
      .finally(() => setTagsLoading(false))
  }, [])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const createTag = useCallback(() => {
    const name = newTagName.trim()
    if (!name) return
    setCreateLoading(true)
    setCreateError(null)
    fetch(routes.api.v1.magicfolder.tags(), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
      .then((r) => r.json() as Promise<{ data?: { tag: TagRow }; error?: { message: string } }>)
      .then((res) => {
        if (res.error) {
          setCreateError(res.error.message)
          return
        }
        if (res.data?.tag) {
          setTags((prev) => [...prev, res.data!.tag])
          setNewTagName("")
          setCreateOpen(false)
        }
      })
      .finally(() => setCreateLoading(false))
  }, [newTagName])

  return (
    <MagicfolderSection layout="stack" className="space-y-6">
      <MagicfolderPageHeader
        title="MagicFolder · Collections"
        description="Virtual folders by document type and tag"
        actions={
          <Link
            href={routes.ui.magicfolder.search()}
            className="text-sm font-medium text-primary hover:underline"
          >
            Search
          </Link>
        }
      />

      <MagicfolderSection title="By type">
        <CollectionList />
      </MagicfolderSection>

      <MagicfolderSection layout="stack">
        <MagicfolderPageHeader
          title="By tag"
          actions={
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Create tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create tag</DialogTitle>
                  <DialogDescription>
                    Add a new tag to organize documents.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                  <Input
                    placeholder="Tag name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createTag()}
                  />
                  {createError && (
                    <MagicfolderHelperText className="mt-2 text-destructive">
                      {createError}
                    </MagicfolderHelperText>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={createTag}
                    disabled={createLoading || !newTagName.trim()}
                  >
                    {createLoading ? "Creating…" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />
        {tagsLoading ? (
          <MagicfolderLoading />
        ) : tags.length === 0 ? (
          <MagicfolderHelperText>
            No tags yet. Add tags to documents to filter by tag here.
          </MagicfolderHelperText>
        ) : (
          <MagicfolderSection layout="grid">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`${routes.ui.magicfolder.search()}?tagId=${tag.id}`}
              >
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">
                      {tag.name}
                    </CardTitle>
                    <Tag className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      View documents with tag &quot;{tag.name}&quot;
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </MagicfolderSection>
        )}
      </MagicfolderSection>

      <MagicfolderHelperText>
        Click a collection to open Search with that filter.
      </MagicfolderHelperText>
    </MagicfolderSection>
  )
}