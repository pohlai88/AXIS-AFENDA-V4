"use client"

import { useEffect, useState } from "react"
import { PlusCircle, Folder, FolderOpen, MoreHorizontal, Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/client/hooks/use-auth"
import useProjectsStore from "@/lib/client/store/projects"
import type { ProjectResponse } from "@/lib/contracts/tasks"

export default function ProjectsPage() {
  const auth = useAuth()
  const {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProjectApi,
    deleteProject,
  } = useProjectsStore()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectResponse | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  })

  useEffect(() => {
    if (auth?.userId) {
      fetchProjects(auth.userId)
    }
  }, [auth?.userId, fetchProjects])

  const handleCreateProject = async () => {
    if (!auth?.userId || !formData.name.trim()) return

    const project = await createProject(auth.userId, {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color,
    })

    if (project) {
      setShowCreateDialog(false)
      setFormData({ name: "", description: "", color: "#3b82f6" })
    }
  }

  const handleEditProject = async () => {
    if (!auth?.userId || !editingProject || !formData.name.trim()) return

    await updateProjectApi(auth.userId, editingProject.id, {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color,
    })

    setShowEditDialog(false)
    setEditingProject(null)
    setFormData({ name: "", description: "", color: "#3b82f6" })
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!auth?.userId) return

    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      await deleteProject(auth.userId, projectId)
    }
  }

  const openEditDialog = (project: ProjectResponse) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || "",
      color: project.color || "#3b82f6",
    })
    setShowEditDialog(true)
  }

  if (!auth) {
    return (
      <div className="space-y-4">
        <Alert>
          <Spinner className="h-5 w-5" />
          <AlertDescription>Loading authentication...</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!auth.userId) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>Not authenticated. Please log in.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Organize your tasks into projects for better management.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Projects</CardTitle>
            <Button
              onClick={() => setShowCreateDialog(true)}
              size="sm"
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
              <Spinner className="size-4" />
              Loading projects…
            </div>
          ) : projects.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <Folder className="h-12 w-12 text-muted-foreground" />
                <EmptyTitle>No projects yet</EmptyTitle>
                <EmptyDescription>
                  Create your first project to start organizing your tasks.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: project.color || "#3b82f6" }}
                        />
                        <h3 className="font-medium truncate">{project.name}</h3>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(project)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {project.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {project.taskCount || 0} tasks
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FolderOpen className="h-3 w-3" />
                        Active
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter project name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter project description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20"
                />
                <span className="text-sm text-muted-foreground">{formData.color}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!formData.name.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter project name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Enter project description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20"
                />
                <span className="text-sm text-muted-foreground">{formData.color}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProject} disabled={!formData.name.trim()}>
              Update Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
