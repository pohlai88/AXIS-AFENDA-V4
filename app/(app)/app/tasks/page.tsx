"use client"

import { useEffect, useState, useRef } from "react"

import { cn } from "@/lib/utils"
import { useTasksStore } from "@/lib/client/store/tasks"
import useProjectsStore from "@/lib/client/store/projects"
import { parseNaturalLanguage } from "@/lib/shared/nl-parser"
import type { TaskResponse } from "@/lib/contracts/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle2, Circle, Trash2, Calendar, Tag, Folder } from "lucide-react"
import { useAuth } from "@/lib/client/hooks/use-auth"
import { TaskDetailsModal } from "./_components/task-details-modal"

export default function TasksPage() {
  const auth = useAuth()
  const {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
  } = useTasksStore()

  const { projects, fetchProjects } = useProjectsStore()

  const [quickAddInput, setQuickAddInput] = useState("")
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Parse input for preview
  const parsedInput = quickAddInput.trim() ? parseNaturalLanguage(quickAddInput) : null

  // Load tasks on mount with authenticated user ID
  useEffect(() => {
    if (auth?.userId) {
      fetchTasks(auth.userId, { status: filter === "all" ? undefined : filter, projectId: selectedProject || undefined })
      fetchProjects(auth.userId)
    }
  }, [auth?.userId, fetchTasks, filter, selectedProject, fetchProjects])

  // Focus quick-add input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  if (!auth) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>Loading authentication...</AlertDescription>
        </Alert>
      </div>
    )
  }

  const userId = auth.userId
  if (!userId) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>Not authenticated. Please log in.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickAddInput.trim()) return

    await createTask(userId, quickAddInput.trim())
    setQuickAddInput("")
    inputRef.current?.focus()
  }

  const handleInputChange = (value: string) => {
    setQuickAddInput(value)
    setShowPreview(value.trim().length > 0)
  }

  const handleToggleDone = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done"
    await updateTaskStatus(userId, taskId, newStatus)
  }

  const handleDelete = async (taskId: string) => {
    await deleteTask(userId, taskId)
  }

  const handleTaskClick = (task: TaskResponse) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const handleTaskSave = async (taskId: string, updates: Partial<TaskResponse>) => {
    await updateTask(userId, taskId, updates)
  }

  const handleTaskDelete = async (taskId: string) => {
    await deleteTask(userId, taskId)
  }

  // Filter tasks based on current filter
  const filteredTasks =
    filter === "all"
      ? tasks
      : tasks.filter((t) => t.status === (filter === "done" ? "done" : "todo"))

  const getPriorityVariant = (
    priority: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "default"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Minimal, keyboard-first task management.
        </p>
      </div>

      <Card size="sm">
        <CardHeader className="border-b px-4 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-lg">Quick add</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleQuickAdd} className="space-y-3">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Add a task... (e.g., 'tomorrow 9am call with Bob')"
              value={quickAddInput}
              onChange={(e) => handleInputChange(e.target.value)}
              className="flex-1 text-base sm:text-sm"
            />

            {/* NL Parser Preview */}
            {showPreview && parsedInput && (
              <div className="rounded-md border bg-muted/30 p-3 text-xs sm:text-sm">
                <div className="font-medium text-muted-foreground mb-2">Preview:</div>
                <div className="space-y-1">
                  <div><strong>Title:</strong> {parsedInput.title}</div>
                  {parsedInput.dueDate && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <strong>Due:</strong> {new Date(parsedInput.dueDate).toLocaleDateString()} {new Date(parsedInput.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {parsedInput.priority && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong>Priority:</strong> <Badge variant="outline">{parsedInput.priority}</Badge>
                    </div>
                  )}
                  {parsedInput.tags && parsedInput.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Tag className="h-3 w-3 shrink-0" />
                      <strong>Tags:</strong> <div className="flex gap-1 flex-wrap">{parsedInput.tags.map(tag => <Badge key={tag} variant="secondary">#{tag}</Badge>)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button type="submit" disabled={!quickAddInput.trim() || loading} className="w-full sm:w-auto" size="lg">
              {loading ? <Spinner className="mr-1.5" /> : null}
              Add Task
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Project Filter */}
      {projects.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Project:</span>
          </div>
          <Select value={selectedProject || ""} onValueChange={(value) => setSelectedProject(value || null)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All projects</SelectItem>
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
      )}

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as typeof filter)}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="todo">To do</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card size="sm">
        <CardHeader className="border-b px-4 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-lg">Task list</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
              <Spinner className="size-4" />
              Loading tasks…
            </div>
          ) : filteredTasks.length === 0 ? (
            <Empty className="p-6 sm:p-10">
              <EmptyHeader>
                <EmptyTitle className="text-lg sm:text-xl">
                  {filter === "all" ? "No tasks yet" : `No ${filter} tasks`}
                </EmptyTitle>
                <EmptyDescription className="text-sm">
                  {filter === "all"
                    ? "Add your first task above."
                    : "Switch filters to see other tasks."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className="gap-2">
              {filteredTasks.map((task) => (
                <Item key={task.id} variant="outline" size="sm" className="cursor-pointer hover:bg-muted/50" onClick={() => handleTaskClick(task)}>
                  <ItemMedia variant="icon">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 sm:size-9"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleDone(task.id, task.status)
                      }}
                      aria-label={
                        task.status === "done"
                          ? "Mark task as to do"
                          : "Mark task as done"
                      }
                    >
                      {task.status === "done" ? (
                        <CheckCircle2 className="size-4 sm:size-5 text-primary" />
                      ) : (
                        <Circle className="size-4 sm:size-5 text-muted-foreground" />
                      )}
                    </Button>
                  </ItemMedia>

                  <ItemContent className="min-w-0">
                    <ItemTitle
                      className={cn(
                        "wrap-break-word text-sm sm:text-base",
                        task.status === "done" &&
                        "text-muted-foreground line-through"
                      )}
                    >
                      {task.title}
                    </ItemTitle>

                    {task.description ? (
                      <ItemDescription className="line-clamp-2 text-xs sm:text-sm">
                        {task.description}
                      </ItemDescription>
                    ) : null}

                    <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
                      {task.dueDate ? (
                        <Badge variant="outline" className="text-xs">
                          {new Date(task.dueDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </Badge>
                      ) : null}

                      {task.priority ? (
                        <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
                          {task.priority}
                        </Badge>
                      ) : null}

                      {task.tags && task.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </ItemContent>

                  <ItemActions>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(task.id)
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 size-8 sm:size-auto"
                      aria-label="Delete task"
                    >
                      <Trash2 className="size-3 sm:size-4" />
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t text-xs sm:text-sm text-muted-foreground">
          <div className="text-center">
            <span className="font-medium text-foreground text-sm sm:text-base block">
              {tasks.filter((t) => t.status === "todo").length}
            </span>
            to do
          </div>
          <div className="text-center">
            <span className="font-medium text-foreground text-sm sm:text-base block">
              {tasks.filter((t) => t.status === "in_progress").length}
            </span>
            in progress
          </div>
          <div className="text-center">
            <span className="font-medium text-foreground text-sm sm:text-base block">
              {tasks.filter((t) => t.status === "done").length}
            </span>
            done
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        userId={userId}
      />
    </div>
  )
}
