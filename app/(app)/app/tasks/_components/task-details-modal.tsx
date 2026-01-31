"use client"

import { useState, useEffect } from "react"
import { Clock, Tag, AlertCircle, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RecurrenceEditor } from "@/components/recurrence-editor"
import type { TaskResponse, TaskPriority, TaskStatus, RecurrenceRule } from "@/lib/contracts/tasks"
import useProjectsStore from "@/lib/client/store/projects"

interface TaskDetailsModalProps {
  task: TaskResponse | null
  isOpen: boolean
  onClose: () => void
  onSave: (taskId: string, updates: Partial<TaskResponse>) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
  userId: string
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; variant: "default" | "secondary" | "destructive" | "outline" }[] = [
  { value: "urgent", label: "Urgent", variant: "destructive" },
  { value: "high", label: "High", variant: "default" },
  { value: "medium", label: "Medium", variant: "secondary" },
  { value: "low", label: "Low", variant: "outline" },
]

const STATUS_OPTIONS: { value: TaskStatus; label: string; icon: React.ReactNode }[] = [
  { value: "todo", label: "To Do", icon: <div className="size-3 rounded-full border-2 border-muted-foreground" /> },
  { value: "in_progress", label: "In Progress", icon: <Clock className="size-3" /> },
  { value: "done", label: "Done", icon: <CheckCircle2 className="size-3 text-green-600" /> },
  { value: "cancelled", label: "Cancelled", icon: <AlertCircle className="size-3 text-destructive" /> },
]

export function TaskDetailsModal({ task, isOpen, onClose, onSave, onDelete, userId }: TaskDetailsModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const { projects, fetchProjects } = useProjectsStore()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    status: "todo" as TaskStatus,
    dueDate: "",
    tags: [] as string[],
    projectId: "",
    recurrence: null as RecurrenceRule | null,
  })

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        priority: task.priority || "medium",
        status: task.status || "todo",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "",
        tags: task.tags || [],
        projectId: task.projectId || "",
        recurrence: task.recurrence || null,
      })
    }
  }, [task])

  // Fetch projects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProjects(userId)
    }
  }, [isOpen, fetchProjects, userId])

  const handleSave = async () => {
    if (!task) return

    setIsSaving(true)
    try {
      const updates: Partial<TaskResponse> = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        tags: formData.tags,
        projectId: formData.projectId || undefined,
        recurrence: formData.recurrence || undefined,
      }

      await onSave(task.id, updates)
      onClose()
    } catch (error) {
      console.error("Failed to save task:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task || !onDelete) return

    if (confirm("Are you sure you want to delete this task?")) {
      setIsSaving(true)
      try {
        await onDelete(task.id)
        onClose()
      } catch (error) {
        console.error("Failed to delete task:", error)
      } finally {
        setIsSaving(false)
      }
    }
  }

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmedTag] }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
  }

  if (!task) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Task Details</DialogTitle>
          <DialogDescription className="text-sm">
            Edit task information and settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Task title"
              className="text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add a detailed description..."
              rows={3}
              className="text-base resize-none"
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Status</Label>
              <Select value={formData.status} onValueChange={(value: TaskStatus) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: TaskPriority) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <Badge variant={option.variant}>{option.label}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-sm">Due Date</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="text-base"
            />
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label className="text-sm">Project</Label>
            <Select value={formData.projectId} onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}>
              <SelectTrigger className="text-base">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: project.color || "#3b82f6" }}
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-sm">Tags</Label>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer text-xs sm:text-sm" onClick={() => removeTag(tag)}>
                  #{tag}
                  <span className="ml-1 text-xs">×</span>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(e.currentTarget.value)
                    e.currentTarget.value = ''
                  }
                }}
                onBlur={(e) => {
                  addTag(e.currentTarget.value)
                  e.currentTarget.value = ''
                }}
                className="text-base flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.querySelector('input')
                  if (input) {
                    addTag(input.value)
                    input.value = ''
                  }
                }}
                size="icon"
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Recurrence */}
          <RecurrenceEditor
            value={formData.recurrence}
            onChange={(recurrence) => setFormData(prev => ({ ...prev, recurrence }))}
            disabled={isSaving}
          />

          {/* Task Metadata */}
          <div className="text-xs sm:text-sm text-muted-foreground space-y-1 border-t pt-4">
            <div>Created: {new Date(task.createdAt).toLocaleString()}</div>
            <div>Updated: {new Date(task.updatedAt).toLocaleString()}</div>
            {task.completedAt && (
              <div>Completed: {new Date(task.completedAt).toLocaleString()}</div>
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end w-full">
            <Button variant="outline" onClick={onClose} disabled={isSaving} className="w-full sm:w-auto">
              Cancel
            </Button>
            {onDelete && (
              <Button variant="destructive" onClick={handleDelete} disabled={isSaving} className="w-full sm:w-auto">
                Delete
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
