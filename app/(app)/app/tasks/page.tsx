"use client"

import { useEffect, useState, useRef } from "react"

import { cn } from "@/lib/utils"
import { useTasksStore } from "@/lib/client/store/tasks"
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
import { AlertCircle, CheckCircle2, Circle, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/client/hooks/use-auth"

export default function TasksPage() {
  const auth = useAuth()
  const {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTaskStatus,
    deleteTask,
  } = useTasksStore()

  const [quickAddInput, setQuickAddInput] = useState("")
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all")
  const inputRef = useRef<HTMLInputElement>(null)

  // Load tasks on mount with authenticated user ID
  useEffect(() => {
    if (auth?.userId) {
      fetchTasks(auth.userId)
    }
  }, [auth?.userId, fetchTasks])

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

  const handleToggleDone = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done"
    await updateTaskStatus(userId, taskId, newStatus)
  }

  const handleDelete = async (taskId: string) => {
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">
          Minimal, keyboard-first task management.
        </p>
      </div>

      <Card size="sm">
        <CardHeader className="border-b">
          <CardTitle>Quick add</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQuickAdd} className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Add a task... (e.g., 'tomorrow 9am call with Bob')"
              value={quickAddInput}
              onChange={(e) => setQuickAddInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!quickAddInput.trim() || loading}>
              {loading ? <Spinner className="mr-1.5" /> : null}
              Add
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
        <CardHeader className="border-b">
          <CardTitle>Task list</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
              <Spinner className="size-4" />
              Loading tasks…
            </div>
          ) : filteredTasks.length === 0 ? (
            <Empty className="p-10">
              <EmptyHeader>
                <EmptyTitle>
                  {filter === "all" ? "No tasks yet" : `No ${filter} tasks`}
                </EmptyTitle>
                <EmptyDescription>
                  {filter === "all"
                    ? "Add your first task above."
                    : "Switch filters to see other tasks."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className="gap-2">
              {filteredTasks.map((task) => (
                <Item key={task.id} variant="outline" size="sm">
                  <ItemMedia variant="icon">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      onClick={() => handleToggleDone(task.id, task.status)}
                      aria-label={
                        task.status === "done"
                          ? "Mark task as to do"
                          : "Mark task as done"
                      }
                    >
                      {task.status === "done" ? (
                        <CheckCircle2 className="size-5 text-primary" />
                      ) : (
                        <Circle className="size-5 text-muted-foreground" />
                      )}
                    </Button>
                  </ItemMedia>

                  <ItemContent className="min-w-0">
                    <ItemTitle
                      className={cn(
                        "wrap-break-word",
                        task.status === "done" &&
                          "text-muted-foreground line-through"
                      )}
                    >
                      {task.title}
                    </ItemTitle>

                    {task.description ? (
                      <ItemDescription className="line-clamp-2">
                        {task.description}
                      </ItemDescription>
                    ) : null}

                    <div className="mt-2 flex flex-wrap gap-2">
                      {task.dueDate ? (
                        <Badge variant="outline">
                          {new Date(task.dueDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </Badge>
                      ) : null}

                      {task.priority ? (
                        <Badge variant={getPriorityVariant(task.priority)}>
                          {task.priority}
                        </Badge>
                      ) : null}

                      {task.tags && task.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary">
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
                      onClick={() => handleDelete(task.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      aria-label="Delete task"
                    >
                      <Trash2 className="size-4" />
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
        <div className="grid grid-cols-3 gap-4 pt-4 border-t text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">
              {tasks.filter((t) => t.status === "todo").length}
            </span>{" "}
            to do
          </div>
          <div>
            <span className="font-medium text-foreground">
              {tasks.filter((t) => t.status === "in_progress").length}
            </span>{" "}
            in progress
          </div>
          <div>
            <span className="font-medium text-foreground">
              {tasks.filter((t) => t.status === "done").length}
            </span>{" "}
            done
          </div>
        </div>
      )}
    </div>
  )
}
